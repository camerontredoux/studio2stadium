#!/usr/bin/env bash
#
# Read-only psql against the production database.
#
# The production credential lives only in the root clone's
# apps/backend/.env.production, never in a worktree
# (docs/guides/production-data-access.md). This finds that file from the root
# clone or any worktree, loads only DATABASE_URL, and runs your SQL inside one
# read-only transaction. It never prints the connection string.
#
# DATABASE_URL is the Supabase owner login. Nothing in the credential stops a
# write, so the guard is the transaction this script opens. Supabase's pooler
# ignores PGOPTIONS, so `-c default_transaction_read_only=on` does nothing
# there; BEGIN READ ONLY does.
#
# Usage, from inside a studio2stadium checkout or worktree:
#   scripts/ro-psql.sh -f query.sql          # or SQL on stdin
#   scripts/ro-psql.sh -At -f query.sql      # other psql output flags pass through
#   scripts/ro-psql.sh --describe org_events
#   scripts/ro-psql.sh --whoami
set -euo pipefail

common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || {
  echo "ro-psql: run this from inside a studio2stadium checkout or worktree." >&2
  exit 1
}
env_file="$(dirname "$common_dir")/apps/backend/.env.production"
if [ ! -f "$env_file" ]; then
  echo "ro-psql: $env_file is missing." >&2
  echo "ro-psql: the production credential lives only in the root clone; see docs/guides/production-data-access.md." >&2
  exit 1
fi

# Read the one DATABASE_URL line instead of sourcing the file, so no other
# secret in it enters this process. Strip one pair of surrounding quotes.
url=$(sed -n 's/^DATABASE_URL=//p' "$env_file" | head -n 1)
url=${url#\"}
url=${url%\"}
url=${url#\'}
url=${url%\'}
if [ -z "$url" ]; then
  echo "ro-psql: DATABASE_URL is not set in $env_file." >&2
  exit 1
fi

# Every statement runs in one transaction that opens READ ONLY. The first
# query takes a snapshot, after which Postgres refuses SET TRANSACTION READ
# WRITE. SET LOCAL keeps the timeouts on this transaction only, so nothing
# leaks onto the pooler's shared connections.
preamble="BEGIN READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '1s';
SET LOCAL idle_in_transaction_session_timeout = '60s';
SELECT current_user AS \"user\", current_database() AS database,
       current_setting('transaction_read_only') AS read_only \\gset ro_
\\if :ro_read_only
\\else
\\echo 'ro-psql: the transaction is not read-only; nothing ran.'
SELECT 1 / 0;
\\endif"
whoami_sql="SELECT current_user AS \"user\", current_database() AS database,
       current_setting('transaction_read_only') AS read_only;"

# Refuse SQL that could leave the read-only transaction or get around it,
# before anything connects:
# - a statement that starts with COMMIT, ROLLBACK, BEGIN, END, ABORT, START
#   TRANSACTION, SAVEPOINT, RELEASE, PREPARE TRANSACTION, SET SESSION, SET
#   TRANSACTION, RESET or DISCARD ends the transaction or changes it, and later
#   statements would autocommit. Keywords count only at the start of a
#   statement, so CASE ... END passes.
# - psql backslash commands run a shell (\!, backticks, \g |cmd, \o |cmd),
#   write files (\g file, \o, \w), change the environment (\setenv), or run
#   SQL this check never sees (\i, \gexec, \c). psql runs one wherever it sits
#   on a line, so they are allowlisted rather than denylisted. Only display
#   commands get through: \x \a \t \pset \echo \qecho \warn \C \f \H \T
#   \timing \gdesc \q, the \d family, \l, \sf, \sv, and \g or \gx with no
#   arguments. Any backtick in their arguments is refused.
# - DO blocks, COPY, set_config(), functions that run SQL from a string
#   (query_to_xml, dblink), pg_terminate_backend, and SET of the settings that
#   decide read-only mode or how psql reads quotes.
# The check reads literals, comments and dollar quotes the way psql does, so a
# word inside a string does not trip it. set_config( is refused even inside a
# string.
IFS= read -r -d '' sql_checker <<'PERL' || true
use strict;
use warnings;

local $/;
my $s = <STDIN>;
$s = '' unless defined $s;
my $n = length $s;
my ( @hits, $code );
$code = '';

# psql runs a backslash command wherever it sits outside a literal or comment, and some
# run a shell or touch files. Only these display commands get through.
my %SAFE = map { $_ => 1 } qw(x a t pset echo qecho warn C f H T timing gdesc q quit);
my %NO_ARGS = map { $_ => 1 } qw(g gx);

sub ident_char { my $c = shift; return defined $c && $c =~ /[A-Za-z0-9_\$\x80-\xff]/ }

my $i = 0;
while ( $i < $n ) {
  my $c  = substr( $s, $i, 1 );
  my $c2 = substr( $s, $i, 2 );
  my $prev = $i > 0 ? substr( $s, $i - 1, 1 ) : undef;
  if ( $c2 eq '--' ) {
    my $j = index( $s, "\n", $i );
    $i = $j < 0 ? $n : $j;
    $code .= ' ';
    next;
  }
  if ( $c2 eq '/*' ) {
    my $depth = 1;
    $i += 2;
    while ( $i < $n && $depth > 0 ) {
      my $d = substr( $s, $i, 2 );
      if    ( $d eq '/*' ) { $depth++; $i += 2 }
      elsif ( $d eq '*/' ) { $depth--; $i += 2 }
      else                 { $i++ }
    }
    $code .= ' ';
    next;
  }
  if ( $c eq "'" ) {
    # An E'' string takes backslash escapes. Count it as one only when the E starts a token;
    # anything doubtful reads as a standard string, which leaves more text visible as code.
    my $pp = $i > 1 ? substr( $s, $i - 2, 1 ) : undef;
    my $estr = defined $prev && $prev =~ /[eE]/ && !ident_char($pp) && !( defined $pp && $pp eq ':' );
    $i++;
    while ( $i < $n ) {
      my $d = substr( $s, $i, 1 );
      if ( $estr && $d eq '\\' ) { $i += 2; next }
      $i++;
      last if $d eq "'";
    }
    $code .= "''";
    next;
  }
  if ( $c eq '"' ) {
    # Keep a quoted identifier's text, so "set_config"(...) still reads as that function.
    # A U&"..." identifier can spell a name in escapes, so it is refused.
    push @hits, 'U&"..."  (a Unicode-escaped identifier can hide a name)'
      if $i > 1 && substr( $s, $i - 2, 2 ) =~ /\A[uU]&\z/;
    my $j = index( $s, '"', $i + 1 );
    $j = $n if $j < 0;
    ( my $inner = substr( $s, $i + 1, $j - $i - 1 ) ) =~ s/[^A-Za-z0-9_\x80-\xff]/_/g;
    $code .= " $inner ";
    $i = $j + 1;
    next;
  }
  if ( $c eq '$' && !ident_char($prev)
    && substr( $s, $i ) =~ /\A(\$(?:[A-Za-z_\x80-\xff][A-Za-z0-9_\x80-\xff]*)?\$)/ )
  {
    my $tag = $1;
    my $j   = index( $s, $tag, $i + length $tag );
    $i = $j < 0 ? $n : $j + length $tag;
    $code .= "''";
    next;
  }
  if ( $c eq '\\' ) {
    # psql reads the command name up to whitespace or the next backslash, and its arguments to
    # the end of the line. An unquoted backslash in the arguments starts another command.
    $i++;
    if ( substr( $s, $i, 1 ) eq '\\' ) { $i++; next; }    # \\ separates commands
    substr( $s, $i ) =~ /\A([^\s\\]*)/;
    my $name = $1;
    $i += length $name;
    my ( $args, $backtick ) = ( '', 0 );
    while ( $i < $n ) {
      my $d = substr( $s, $i, 1 );
      last if $d eq "\n";
      if ( $d eq '\\' ) {
        $i += 2 if substr( $s, $i, 2 ) eq '\\\\';
        last;
      }
      if ( $d eq "'" ) {
        my $j = $i + 1;
        while ( $j < $n ) {
          my $e = substr( $s, $j, 1 );
          last if $e eq "\n";
          if ( $e eq '\\' ) { $j += 2; next }
          $j++;
          last if $e eq "'";
        }
        $args .= substr( $s, $i, $j - $i );
        $i = $j;
        next;
      }
      if ( $d eq '"' ) {
        my $j = index( $s, '"', $i + 1 );
        my $nl = index( $s, "\n", $i );
        $j = $nl if $j < 0 || ( $nl >= 0 && $nl < $j );
        $j = $n - 1 if $j < 0;
        $backtick = 1 if substr( $s, $i, $j - $i + 1 ) =~ /`/;
        $args .= substr( $s, $i, $j - $i + 1 );
        $i = $j + 1;
        next;
      }
      $backtick = 1 if $d eq '`';
      $args .= $d;
      $i++;
    }
    $args =~ s/^\s+|\s+$//g;
    my $shown = "\\$name" . ( length $args ? " $args" : '' );
    if ($backtick) {
      push @hits, "$shown  (a backtick runs a shell command)";
    }
    elsif ( $NO_ARGS{$name} ) {
      push @hits, "$shown  (\\$name takes no arguments here; it would write a file or run a command)"
        if length $args;
    }
    elsif ( !$SAFE{$name} && $name !~ /^(?:d[A-Za-z+]*|l\+?|s[fv]\+?)$/ ) {
      push @hits, "$shown  (only display commands such as \\x, \\pset, \\echo and \\d are allowed)";
    }
    $code .= ( $name =~ /^g/ ) ? ';' : ' ';
    next;
  }
  $code .= $c;
  $i++;
}

# A function call that runs SQL from a string, changes a setting or acts on another session.
# set_config is matched in the raw text too, so a DO body or a query string cannot hide it.
push @hits, 'set_config(...)  (changes a server setting)'
  if $s =~ /\bset_config"?\s*\(/i || lc($code) =~ /\bset_config\s*\(/;
my $lc = lc $code;
while ( $lc =~ /\b(query_to_xml\w*|ts_stat|ts_rewrite|dblink\w*|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|pg_promote|lo_import|lo_export|pg_file_\w+)\s*\(/g ) {
  push @hits, "$1(...)  (runs SQL from a string, writes a file or acts on another session)";
}
push @hits, 'UPDATE pg_settings  (changes a server setting)'
  if $lc =~ /\bupdate\s+(?:only\s+)?(?:pg_catalog\s*\.\s*)?pg_settings\b/;
push @hits, 'READ WRITE  (turns read-only off)' if $lc =~ /\bread\s+write\b/;

for my $stmt ( split /;/, $lc ) {
  $stmt =~ s/\s+/ /g;
  $stmt =~ s/^ | $//g;
  next unless length $stmt;
  my $short = length $stmt > 60 ? substr( $stmt, 0, 60 ) . '...' : $stmt;
  if ( $stmt =~ /^do\b/ ) { push @hits, "$short  (a DO block runs code this check cannot read)"; next }
  if ( $stmt =~ /^copy\b/ ) { push @hits, "$short  (COPY reads or writes files; use a SELECT)"; next }
  if ( $stmt =~ /^set\b/
    && $stmt =~ /read_only|characteristics|standard_conforming_strings|client_encoding|^set (?:session |local )?names\b|session authorization/ )
  {
    push @hits, "$short  (changes read-only mode or how psql reads this SQL)";
    next;
  }
  if ( $stmt =~ /^(?:commit|rollback|begin|end|abort|start transaction|savepoint|release|prepare transaction|set (?:session|transaction)|reset|discard)\b/ ) {
    push @hits, "$short  (transaction control would leave the read-only transaction)";
  }
  elsif ( $stmt =~ /transaction_read_only/ ) {
    push @hits, "$short  (mentions transaction_read_only)";
  }
}

print "$_\n" for @hits;
exit( @hits ? 1 : 0 );
PERL

check_sql() {
  local hits status
  hits=$(printf '%s\n' "$1" | perl -e "$sql_checker") && return 0
  status=$?
  if [ "$status" -ne 1 ]; then
    echo "ro-psql: could not check the SQL (perl exited $status); nothing ran." >&2
    exit 2
  fi
  echo "ro-psql: refused. This SQL has transaction control or a psql command that could leave the read-only transaction:" >&2
  printf '%s\n' "$hits" | sed 's/^/  /' >&2
  echo "ro-psql: a write needs the captain's explicit yes; see docs/guides/production-data-access.md." >&2
  exit 2
}

run() {
  # $1 is the SQL; the rest are psql flags.
  local sql=$1
  shift
  printf '%s\n%s\n;\nROLLBACK;\n' "$preamble" "$sql" |
    PGCLIENTENCODING=UTF8 psql "$url" -X -q -v ON_ERROR_STOP=1 "$@"
}

case "${1:-}" in
  --whoami)
    run "$whoami_sql"
    exit
    ;;
  --describe)
    if [ $# -ne 2 ]; then
      echo "usage: ro-psql.sh --describe <table>" >&2
      exit 2
    fi
    if ! [[ $2 =~ ^[A-Za-z_][A-Za-z0-9_.]*$ ]]; then
      echo "ro-psql: $2 is not a table name." >&2
      exit 2
    fi
    run "SELECT to_regclass('$2') IS NOT NULL AS found \\gset ro_
\\if :ro_found
\\else
SELECT 'no table named $2. Similar: ' || coalesce(string_agg(table_schema || '.' || table_name, ', ' ORDER BY 1), 'none') AS missing
FROM information_schema.tables WHERE table_name ILIKE '%$2%';
\\quit
\\endif
SELECT a.attname AS column,
       format_type(a.atttypid, a.atttypmod) AS type,
       CASE WHEN a.attnotnull THEN 'not null' ELSE '' END AS nullable,
       coalesce(pg_get_expr(d.adbin, d.adrelid), '') AS \"default\"
FROM pg_attribute a
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE a.attrelid = to_regclass('$2')
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;"
    exit
    ;;
esac

# Collect the SQL from -f or stdin. Pass only output flags to psql: -c skips
# the transaction this script wraps around stdin, -v and -o can carry a command
# or a file write past the check, and the script picks the database.
sql_file=""
psql_args=()
need_value() {
  if [ "$2" -lt 2 ]; then
    echo "ro-psql: $1 needs a value." >&2
    exit 2
  fi
}
while [ $# -gt 0 ]; do
  case "$1" in
    -f | --file)
      need_value "$1" $#
      sql_file=$2
      shift 2
      ;;
    --file=*)
      sql_file=${1#*=}
      shift
      ;;
    -F | -R | -P | -T | --field-separator | --record-separator | --pset | --table-attr)
      need_value "$1" $#
      psql_args+=("$1" "$2")
      shift 2
      ;;
    -[FRPT]?* | --field-separator=* | --record-separator=* | --pset=* | --table-attr=* | \
      --csv | --html | --no-align | --tuples-only | --expanded | --quiet | --echo-all | \
      --echo-errors | --echo-queries | --echo-hidden | --field-separator-zero | \
      --record-separator-zero | --no-readline | --no-psqlrc)
      psql_args+=("$1")
      shift
      ;;
    *)
      if [[ $1 =~ ^-[AtxqHaebEnz0X]+$ ]]; then
        psql_args+=("$1")
        shift
      else
        echo "ro-psql: $1 is not supported. Pass SQL with -f <file> or on stdin, plus psql output flags (-A -t -x -q --csv -F -P ...); the script picks the database." >&2
        exit 2
      fi
      ;;
  esac
done

if [ "$sql_file" = "-" ]; then
  sql=$(cat)
elif [ -n "$sql_file" ]; then
  sql=$(cat -- "$sql_file")
elif [ ! -t 0 ]; then
  sql=$(cat)
else
  echo "usage: ro-psql.sh [psql output flags] -f query.sql   (or SQL on stdin)" >&2
  exit 2
fi

check_sql "$sql"
# bash 3.2 (macOS) treats an empty array as unset under `set -u`.
run "$sql" ${psql_args[@]+"${psql_args[@]}"}
