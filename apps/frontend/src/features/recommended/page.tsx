import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuChartBar, LuGrid3X3, LuList } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { recommendedQueries } from "./api/queries";
import {
  MatchFactorsComparison,
  MatchScatterPlot,
  MatchScoreRadar,
  MatchScoreRing,
  MatchSummaryStats,
  SchoolMatchCard,
  TierDistribution,
  TopSchoolsChart,
} from "./components";

type ViewMode = "cards" | "list" | "chart";

export function RecommendedPage() {
  const { data: schools } = useSuspenseQuery(recommendedQueries.recommended());
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedSchoolIndex, setSelectedSchoolIndex] = useState(0);

  const selectedSchool = schools[selectedSchoolIndex];

  return (
    <div className="container max-w-7xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Recommended Programs
        </h1>
        <p className="text-muted-foreground mt-2">
          Schools that match your profile based on skills, styles, sports,
          location, and academic requirements.
        </p>
      </div>

      <MatchSummaryStats schools={schools} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Match Tier Distribution</CardTitle>
            <CardDescription>
              How your matches are distributed across quality tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TierDistribution schools={schools} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Recommendations</CardTitle>
            <CardDescription>
              Your highest scoring program matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopSchoolsChart schools={schools} limit={8} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparison" className="space-y-6">
        <TabsList>
          <TabsTrigger value="comparison">Factor Comparison</TabsTrigger>
          <TabsTrigger value="scatter">Scatter Analysis</TabsTrigger>
          <TabsTrigger value="individual">Individual Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Match Factors Comparison</CardTitle>
              <CardDescription>
                Compare how well your top matches align across different factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchFactorsComparison schools={schools} limit={6} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scatter">
          <Card>
            <CardHeader>
              <CardTitle>Skills vs Styles Analysis</CardTitle>
              <CardDescription>
                Visualize the relationship between skills and styles match
                percentages. Bubble size represents overall match score.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchScatterPlot
                schools={schools}
                xAxis="skills"
                yAxis="styles"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Individual School Breakdown</CardTitle>
                  <CardDescription>
                    Select a school to see its detailed match profile
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {schools.slice(0, 10).map((school, index) => (
                  <button
                    key={school.id}
                    onClick={() => setSelectedSchoolIndex(index)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedSchoolIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {school.name.length > 15
                      ? school.name.slice(0, 13) + "..."
                      : school.name}
                  </button>
                ))}
              </div>

              {selectedSchool && (
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col items-center justify-center">
                    <MatchScoreRadar school={selectedSchool} />
                    <p className="text-muted-foreground mt-2 text-center text-sm">
                      Radar chart showing match strength across all factors
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <MatchScoreRing school={selectedSchool} size="lg" />
                    <p className="text-muted-foreground mt-4 text-center text-sm">
                      Weighted score breakdown by factor contribution
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Recommendations</h2>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
            >
              <LuGrid3X3 className="size-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <LuList className="size-4" />
            </Button>
            <Button
              variant={viewMode === "chart" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("chart")}
              aria-label="Chart view"
            >
              <LuChartBar className="size-4" />
            </Button>
          </div>
        </div>

        {viewMode === "cards" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <SchoolMatchCard key={school.id} school={school} />
            ))}
          </div>
        )}

        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              <TopSchoolsChart
                schools={schools}
                limit={schools.length}
                className="p-4"
              />
            </CardContent>
          </Card>
        )}

        {viewMode === "chart" && (
          <Card>
            <CardContent className="pt-6">
              <MatchScatterPlot
                schools={schools}
                xAxis="skills"
                yAxis="sports"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
