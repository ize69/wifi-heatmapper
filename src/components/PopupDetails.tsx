/*
 * wifi-heatmapper
 * File: src/components/PopupDetails.tsx
 * Purpose: Small popup UI that displays details for a single survey point.
 * Generated: 2025-12-18T10:28:20.555Z
 */

import React, { useState } from "react";
import { SurveyPoint, HeatmapSettings, SurveyPointActions } from "@/lib/types";
import { formatMacAddress, metricFormatter } from "@/lib/utils";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { AlertDialogModal } from "@/components/AlertDialogModal";

interface PopupDetailsProps {
  point: SurveyPoint | null;
  settings: HeatmapSettings;
  surveyPointActions: SurveyPointActions;
  onClose: () => void; // New prop to close the popup
}

/**
 * PopupDetails is a "conditionally rendered <div>" that appears when its "point"
 * is non-null (otherwise it simply returns, not rendering anything)
 * (Original code had this test in Floorplan...)
 * @param point
 * @param settings
 * @param surveyPointActions
 * @param onClose - called when window should be closed
 * @returns
 */
const PopupDetails: React.FC<PopupDetailsProps> = ({
  point,
  settings,
  surveyPointActions,
  onClose,
}) => {
  // if no point passed in, just return
  if (!point) return;

  //   | Stat | Value |
  // | ---- | ----- |
  // | ID | Point ###  |
  // | SSID | abcdef |
  // | Signal Strength | 50% |
  // | RSSI | -70 dBm |
  // | Channel | 6 |
  // | Band | 2.4 GHz |
  // | BSSID | ##:##:##:##:##:## |
  // | AP Name | |
  // |  |  |
  // | Strongest SSID |<link to another PopupDetail?> |
  // | TCP Download | 0.00 Mbps |
  // | TCP Upload | 0.00 Mbps |
  // | Position | X: 274, Y: 47 |
  // | Created  | 9/16/2025, 9:39:44 PM |

  // const { settings, updateSettings } = useSettings();
  const [isEnabled, setIsEnabled] = useState(point.isEnabled);
  const rows = [
    { label: "ID", value: point.id },
    { label: "SSID", value: point.wifiData?.ssid },
    {
      label: "Signal Strength",
      value: `${point.wifiData.signalStrength}%`,
      // value: `${point.wifiData?.signalStrength || rssiToPercentage(point.wifiData?.rssi)}%`,
    },
    { label: "RSSI", value: `${point.wifiData.rssi} dBm` },
    { label: "Channel", value: point.wifiData?.channel },
    { label: "Band", value: `${point.wifiData?.band} GHz` },
    { label: "BSSID", value: formatMacAddress(point.wifiData?.bssid || "") },
    {
      label: "AP Name",
      value: settings.apMapping.find(
        (ap) => ap.macAddress === point.wifiData?.bssid,
      )?.apName,
    },
  ];

  if (point.iperfData) {
    rows.push(
      {
        label: "TCP Download",
        value: metricFormatter(
          point.iperfData.tcpDownload.bitsPerSecond,
          "tcpDownload",
          "bitsPerSecond",
        ),
      },
      {
        label: "TCP Upload",
        value: metricFormatter(
          point.iperfData.tcpUpload.bitsPerSecond,
          "tcpUpload",
          "bitsPerSecond",
        ),
      },
    );
  }
  rows.push({ label: "Position", value: `X: ${point.x}, Y: ${point.y}` });
  rows.push({
    label: "Created",
    value: new Date(point.timestamp).toLocaleString(),
  });

  /**
   * User clicked the Enabled switch.
   * Report back to the parent
   */
  const handleToggle = () => {
    setIsEnabled((prev) => {
      const newState = !prev;
      surveyPointActions.update(point, { isEnabled: newState });
      return newState;
    });
  };

  /**
   * User clicked the Delete button
   * Report back to the parent
   */
  const handleDelete = (point: SurveyPoint) => {
    surveyPointActions.delete([point]); // single-element array containing the point
    onClose();
  };

  return (
<div className="bg-gray-800 border border-gray-700 rounded-md shadow-lg text-xs overflow-hidden text-gray-100">
  {/* Header */}
  <div className="flex justify-between items-center bg-gray-900 px-3 py-2">
    <h3 className="font-semibold text-sm text-gray-100">Measurement Details</h3>
    <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
      <X size={16} />
    </button>
  </div>

  {/* Table */}
  <Table className="bg-gray-800">
    <TableBody>
      {rows.map((row, index) => (
        <TableRow
          key={row.label}
          className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}
        >
          <TableCell className="py-1 px-2 font-medium text-gray-100">{row.label}</TableCell>
          <TableCell className="py-1 px-2 text-gray-100">{row.value}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

  {/* Footer */}
  <div className="flex justify-between items-center px-3 py-2 bg-gray-900 border-t border-gray-700">
    <div className="flex items-center space-x-2">
      <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      <span className="text-gray-100">Enabled</span>
    </div>
    <AlertDialogModal
      title="Delete Measurement?"
      description="Are you sure you want to delete this measurement?"
      onCancel={() => {}}
      onConfirm={() => handleDelete(point)}
    >
      <Button
        variant="destructive"
        size="sm"
        className="flex items-center space-x-1"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </Button>
    </AlertDialogModal>
  </div>
</div>


  );
};

export default PopupDetails;
