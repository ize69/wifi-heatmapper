/*
 * wifi-heatmapper
 * File: src/components/TabPanel.tsx
 * React component for the UI.
 * Generated: 2025-12-18T10:28:20.555Z
 */

import * as Tabs from "@radix-ui/react-tabs";
import { useState } from "react";

import { useSettings } from "./GlobalSettings";

import SettingsEditor from "@/components/SettingsEditor";
import ClickableFloorplan from "@/components/Floorplan";
import { Heatmaps } from "@/components/Heatmaps";
import PointsTable from "@/components/PointsTable";

const TAB_TRIGGER_CLASS =
  "px-4 py-2.5 text-base font-medium bg-gray-300 text-gray-800 border border-gray-400 border-b-0 rounded-t-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-200 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-gray-500";

  

/**
 * default function TabPanel — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export default function TabPanel() {
  const { settings, updateSettings, surveyPointActions } = useSettings();
  // Build floors list (backwards compatible)
  const floors = (settings.floorplans && settings.floorplans.length > 0)
    ? settings.floorplans.slice().sort((a,b) => (a.z||0)-(b.z||0))
    : [{ name: settings.floorplanImageName, path: settings.floorplanImagePath, z: 0 }];
  const activeZ = settings.currentFloorZ ?? 0;
  const activeFloor = floors.find((f) => (f.z ?? 0) === activeZ) || floors[0];

  // Build tabs dynamically so we can add a 3D heatmap tab when multiple floors exist
  const tabs: { value: string; label: string; content: any }[] = [
    { value: "settings", label: "Settings", content: <SettingsEditor /> },
    { value: "floorplan", label: "Floor Plan", content: <ClickableFloorplan /> },
  ];

  if ((floors && floors.length) > 1) {
    // multiple floors: show 2D and 3D heatmap tabs
    tabs.push({ value: "heatmaps2d", label: "2D Heat Maps", content: <Heatmaps mode="2d" /> });
    tabs.push({ value: "heatmaps3d", label: "3D Heat Map", content: <Heatmaps mode="3d" /> });
  } else {
    tabs.push({ value: "heatmaps", label: "Heat Maps", content: <Heatmaps /> });
  }

  tabs.push({
    value: "points",
    label: "Survey Points",
    content: (settingsArg: any, actions: any) => (
      <PointsTable
        data={settingsArg.surveyPoints.filter((p: any) => (p.floorZ ?? 0) === (settingsArg.currentFloorZ ?? 0))}
        surveyPointActions={actions}
        apMapping={settingsArg.apMapping}
      />
    ),
  });

  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZ = parseInt(e.target.value, 10);
    const sel = floors.find((f) => (f.z ?? 0) === newZ);
    if (!sel) return;
    updateSettings({ currentFloorZ: newZ, floorplanImageName: sel.name, floorplanImagePath: sel.path });
  };

  return (
    <div className="w-full p-2">
      <Tabs.Root defaultValue={tabs[0].value}>
        {/* Tab Headers */}
        <Tabs.List className="flex items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            {tabs.map(({ value, label }) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className={TAB_TRIGGER_CLASS}
              >
                {label}
              </Tabs.Trigger>
            ))}
          </div>
          <div>
            <select
              aria-label="Select floor"
              value={(activeFloor?.z ?? 0).toString()}
              onChange={handleFloorChange}
              className="px-3 py-1 border border-gray-700 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
            >
              {floors.map((f) => (
                <option key={(f.z ?? 0).toString()} value={(f.z ?? 0).toString()}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </Tabs.List>

        {/* Tab Content */}
        {tabs.map(({ value, content }) => (
          <Tabs.Content key={value} value={value} className="p-4">
            {typeof content === "function"
              ? content(settings, surveyPointActions)
              : content}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}