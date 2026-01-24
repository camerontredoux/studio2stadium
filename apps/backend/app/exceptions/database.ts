import { Exception } from "@adonisjs/core/exceptions";

export default class DatabaseException extends Exception {
  static status = 400;
  static code = "E_DATABASE_ERROR";
}
