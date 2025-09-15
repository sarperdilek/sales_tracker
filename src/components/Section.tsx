"use client";
import { Card, CardContent, Typography } from "@mui/material";
import { ReactNode } from "react";

export default function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ backgroundColor: "#fff" }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}


