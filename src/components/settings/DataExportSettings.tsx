import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DataExportSettings() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Download className="h-5 w-5" /> Data Export
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Download your data at any time. Your information belongs to you.
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          Use the full export tool to choose date ranges, formats, and exactly what to include.
          Supports plain text, JSON, CSV, printable reports, and therapy-ready summaries.
        </p>
        <Button onClick={() => navigate('/export')} className="gap-2">
          Open export tool <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
