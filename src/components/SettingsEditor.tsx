/*
 * wifi-heatmapper
 * File: src/components/SettingsEditor.tsx
 * React component for the UI.
 * Generated: 2025-12-18T10:28:20.555Z
 */

import { useSettings } from "@/components/GlobalSettings";
import { useState } from "react";
import { PasswordInput } from "./PasswordInput";
import { Label } from "@/components/ui/label";
import { PopoverHelper } from "@/components/PopoverHelpText";
import HeatmapAdvancedConfig from "./HeatmapAdvancedConfig";
import MediaDropdown from "./MediaDropdown";

/**
 * SettingsEditor - UI for editing application settings including floors.
 * Allows floors to have a user-visible `name` independent of the image filename.
 */
export default function SettingsEditor() {
  const { settings, updateSettings, readNewSettingsFromFile } = useSettings();
  const [floorsOpen, setFloorsOpen] = useState(false);

  function handleNewImageFile(theFile: string): void {
    readNewSettingsFromFile(theFile);
  }

  const getFloors = () =>
    settings.floorplans && settings.floorplans.length > 0
      ? settings.floorplans.slice()
      : [
          {
            name: settings.floorplanImageName || "",
            path: settings.floorplanImagePath || "/media/EmptyFloorPlan.png",
            z: 0,
          },
        ];

  const setFloors = (floors: Array<{ name: string; path: string; z?: number }>) => {
    const normalized = floors.map((f, i) => ({
      name: f.name || `Floor ${i + 1}`,
      path: f.path || "/media/EmptyFloorPlan.png",
      z: f.z ?? i,
    }));
    updateSettings({
      floorplans: normalized,
      currentFloorZ: normalized[0]?.z ?? 0,
      floorplanImageName: normalized[0]?.name,
      floorplanImagePath: normalized[0]?.path,
    });
  };

  const addFloor = () => {
    const floors = getFloors();
    const newFloor = {
      name: `Floor ${floors.length + 1}`,
      path: "/media/EmptyFloorPlan.png",
      z: floors.length === 0 ? 0 : (floors[floors.length - 1].z ?? floors.length - 1) + 1,
    } as const;
    setFloors([...floors, newFloor]);
  };

  const removeFloor = (index: number) => {
    const floors = getFloors();
    floors.splice(index, 1);
    const reZed = floors.map((f, i) => ({ ...f, z: i }));
    setFloors(reZed);
  };

  const updateFloorName = (index: number, name: string) => {
    const floors = getFloors();
    floors[index] = { ...floors[index], name };
    setFloors(floors);
  };

  const updateFloorImage = (index: number, fileName: string) => {
    const floors = getFloors();
    // Do not overwrite the user-visible floor `name` when an image is selected.
    floors[index] = { ...floors[index], path: `/media/${fileName}` };
    setFloors(floors);
  };

  return (
    <table className="w-auto">
      <tbody>
        <tr>
          <td className="text-right pr-4 align-top">
            <div className="flex items-center">
              <Label className="font-bold text-lg">Floors</Label>
              <PopoverHelper text="Manage multiple floors: add, name and upload images for each floor. If no image is provided, EmptyFloorPlan.png is used." />
            </div>
          </td>
          <td>
            <div>
              <button
                className="mb-2 px-2 py-1 bg-gray-800 text-white rounded"
                onClick={() => setFloorsOpen((s) => !s)}
              >
                {floorsOpen ? "Hide Floors" : "Manage Floors"}
              </button>

              {floorsOpen && (
                <div className="space-y-2 border border-gray-700 p-3 rounded bg-gray-900 text-white">
                  {getFloors().map((f, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={f.name}
                        onChange={(e) => updateFloorName(idx, e.target.value)}
                        className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white"
                        placeholder={`Floor ${idx + 1} name`}
                      />
                      <div className="w-56">
                        <MediaDropdown
                          defaultValue={f.path ? f.path.split("/").pop() : undefined}
                          onChange={(val) => updateFloorImage(idx, val)}
                        />
                      </div>
                      <button
                        className="px-2 py-1 bg-red-600 text-white rounded"
                        onClick={() => removeFloor(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div>
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded"
                      onClick={addFloor}
                    >
                      Add Floor
                    </button>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>

        <tr>
          <td className="text-right pr-4">
            <Label htmlFor="iperfServer" className="font-bold text-lg">
              iperfServer&nbsp;
              <PopoverHelper text="Address of an iperf3 server. Set to 'localhost' to ignore." />
            </Label>{" "}
          </td>
          <td>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-sm p-2 focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-400"
              value={settings.iperfServerAdrs}
              onChange={(e) =>
                updateSettings({ iperfServerAdrs: e.target.value.trim() })
              }
            />
          </td>
        </tr>
        {settings.iperfServerAdrs &&
          settings.iperfServerAdrs.trim().toLowerCase() !== "localhost" && (
            <tr>
              <td className="text-right pr-4">
                <Label htmlFor="iperfServerBackup" className="font-bold text-lg">
                  iperfServer backup&nbsp;
                  <PopoverHelper text="Address of an iperf3 server. Set to 'localhost' to ignore." />
                </Label>{" "}
              </td>
              <td>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-sm p-2 focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-400"
                  value={settings.iperfServerBackupAdrs || ""}
                  onChange={(e) =>
                    updateSettings({ iperfServerBackupAdrs: e.target.value.trim() })
                  }
                />
              </td>
            </tr>
          )}

        <tr>
          <td className="text-right pr-4">
            <Label htmlFor="testDuration" className="font-bold text-lg">
              Test Duration&nbsp;
              <PopoverHelper text="Duration of the speed test (in seconds)." />
            </Label>
          </td>
          <td>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-sm p-2 focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-400"
              value={settings.testDuration}
              onChange={(e) =>
                updateSettings({ testDuration: Number(e.target.value.trim()) })
              }
            />
          </td>
        </tr>

        <tr>
          <td className="text-right pr-4">
            <Label htmlFor="sudoPassword" className="font-bold text-lg">
              sudo password&nbsp;
              <PopoverHelper text="Enter the sudo password: required on macOS or Linux." />
            </Label>
          </td>
          <td>
            <PasswordInput
              value={settings.sudoerPassword}
              onChange={(e) => updateSettings({ sudoerPassword: e })}
            />
          </td>
        </tr>

        <tr>
          <td colSpan={2} className="text-right">
            <HeatmapAdvancedConfig />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

