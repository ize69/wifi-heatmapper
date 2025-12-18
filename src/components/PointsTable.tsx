import React, { useCallback, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApMapping, SurveyPoint, SurveyPointActions } from "@/lib/types";
import { Switch } from "./ui/switch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { rssiToPercentage } from "@/lib/utils";
import { AlertDialogModal } from "./AlertDialogModal";
import { PopoverHelper } from "./PopoverHelpText";

type FlattenedSurveyPoint = {
  id: string;
  x: number;
  y: number;
  ssid: string;
  bssid: string;
  rssi: number;
  channel: number;
  security: string;
  txRate: number;
  phyMode: string;
  channelWidth: number;
  band: string;
  tcpDownloadMbps: number;
  tcpUploadMbps: number;
  udpDownloadMbps: number;
  udpUploadMbps: number;
  timestamp: string;
  isEnabled: boolean;
  origPoint: SurveyPoint; // to remember the original point
};

interface SurveyPointsTableProps {
  data: SurveyPoint[];
  surveyPointActions: SurveyPointActions;
  // onDelete: (ids: string[]) => void;
  // updateDatapoint: (id: string, data: Partial<SurveyPoint>) => void;
  apMapping: ApMapping[];
}

const SurveyPointsTable: React.FC<SurveyPointsTableProps> = ({
  data,
  surveyPointActions,
  apMapping,
}) => {
  const myUpdate = surveyPointActions.update;
  const myDelete = surveyPointActions.delete;

  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    id: true,
    signalQuality: true,
    bssid: true,
    band: true,
    tcpDownloadMbps: true,
    tcpUploadMbps: true,
    timestamp: true,
    disable: true,
    rssi: false,
    ssid: false,
    security: false,
    txRate: false,
    phyMode: false,
    channelWidth: false,
    channel: false,
    x: false,
    y: false,
  });

  const columns: ColumnDef<FlattenedSurveyPoint>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: "ID",
      },
      {
        id: "disable",
        header: () => (
          <>
            Disable
            <span className="ml-1 relative -top-0.5">
              <PopoverHelper text="Disabling a point will prevent it from being used in the heatmap." />
            </span>
          </>
        ),
        cell: ({ row }) => (
          <Switch
            checked={row.original.isEnabled}
            onCheckedChange={(value) => {
              myUpdate(row.original.origPoint, {
                isEnabled: value,
              });
            }}
          />
        ),
        accessorKey: "isEnabled",
        enableSorting: true,
      },
      {
        accessorKey: "rssi",
        header: "RSSI [dBm]",
      },
      {
        accessorKey: "signalQuality",
        header: "Signal Quality [%]",
      },
      {
        accessorKey: "bssid",
        header: "BSSID",
      },
      {
        accessorKey: "band",
        header: "Band",
      },
      {
        accessorKey: "channel",
        header: "Channel",
      },
      {
        accessorKey: "tcpDownloadMbps",
        header: "TCP Down [Mbps]",
      },
      {
        accessorKey: "tcpUploadMbps",
        header: "TCP Up [Mbps]",
      },
      {
        accessorKey: "udpDownloadMbps",
        header: "UDP Down [Mbps]",
      },
      {
        accessorKey: "udpUploadMbps",
        header: "UDP Up [Mbps]",
      },
      {
        accessorKey: "timestamp",
        header: "Timestamp",
      },
      {
        accessorKey: "ssid",
        header: "SSID",
      },
      {
        accessorKey: "security",
        header: "Security",
      },
      {
        accessorKey: "txRate",
        header: "TX Rate",
      },
      {
        accessorKey: "phyMode",
        header: "PHY Mode",
      },
      {
        accessorKey: "channelWidth",
        header: "Channel Width",
      },

      {
        accessorKey: "x",
        header: "X",
      },
      {
        accessorKey: "y",
        header: "Y",
      },
    ],
    [myUpdate],
  );

  const convertToMbps = (bitsPerSecond: number) => {
    return Math.round((bitsPerSecond / 1000000) * 100) / 100;
  };

  const flattenedData: FlattenedSurveyPoint[] = useMemo(() => {
    return data.map((point) => {
      let bssid = point.wifiData.bssid;
      if (apMapping.length > 0) {
        const mappedName = apMapping.find(
          (ap) => ap.macAddress === point.wifiData.bssid,
        )?.apName;
        if (mappedName) {
          bssid = `${mappedName} (${point.wifiData.bssid})`;
        }
      }
      return {
        origPoint: point,
        ...point,
        ...point.wifiData,
        bssid,
        tcpDownloadMbps: convertToMbps(
          point.iperfData.tcpDownload.bitsPerSecond,
        ),
        tcpUploadMbps: convertToMbps(point.iperfData.tcpUpload.bitsPerSecond),
        udpDownloadMbps: convertToMbps(
          point.iperfData.udpDownload.bitsPerSecond,
        ),
        udpUploadMbps: convertToMbps(point.iperfData.udpUpload.bitsPerSecond),
        // we take the signal strength from the wifi scanner if available, otherwise we use the rssi
        signalQuality:
          point.wifiData.signalStrength ||
          rssiToPercentage(point.wifiData.rssi),
        band: `${point.wifiData.band} Mhz`,
        timestamp: new Date(point.timestamp).toLocaleString(),
      };
    });
  }, [data, apMapping]);

  const table = useReactTable({
    data: flattenedData,
    columns,
    state: {
      rowSelection,
      globalFilter,
      columnVisibility,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleDelete = useCallback(() => {
    const selectedPoints = Object.keys(rowSelection).map(
      (index) => flattenedData[parseInt(index)].origPoint,
    );
    myDelete(selectedPoints);
  }, [rowSelection, flattenedData, myDelete]);

  const toggleDisableSelected = useCallback(() => {
    const selectedPoints = Object.keys(rowSelection).map(
      (index) => flattenedData[parseInt(index)].origPoint,
    );
    const allHidden = selectedPoints.every(
      (allPoints) =>
        flattenedData.find((point) => point.id === allPoints.id)?.isEnabled,
    );
    selectedPoints.forEach((id) => {
      myUpdate(id, { isEnabled: !allHidden });
    });
  }, [rowSelection, flattenedData, myUpdate]);

  //function to export the data in the table as a csv
  const exportCsv = useCallback(() => {
    // rows to export: selected > filtered
    const rows =
      table.getSelectedRowModel().rows.length > 0
        ? table.getSelectedRowModel().rows
        : table.getFilteredRowModel().rows;
  
    if (rows.length === 0) return;
  
    // visible columns (exclude selection + internal fields)
    const columns = table
      .getAllLeafColumns()
      .filter((col) => col.id !== "select" && col.id !== "origPoint");
  
    const headers = columns.map((col) => col.id);
  
    const csv = [
      headers.join(","), // header row
      ...rows.map((row) =>
        headers
          .map((key) => {
            const value = row.getValue(key);
            if (value == null) return "NA";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");
  
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = "survey-points.csv";
    link.click();
  
    URL.revokeObjectURL(url);
  }, [table]);
  
  //
  //import csv file and ask if will be added to curent points or replace them
  const [pendingImport, setPendingImport] = useState<SurveyPoint[] | null>(null);

const parseCsv = async (file: File, existingPoints: SurveyPoint[]): Promise<SurveyPoint[]> => {
  const text = await file.text();
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);

  const headers = headerLine.split(",").map((h) => h.trim());

  const parsedPoints: SurveyPoint[] = lines.map((line) => {
    const values = line
      .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)!
      .map((v) => v.replace(/^"|"$/g, ""));

    const row: any = Object.fromEntries(
      headers.map((h, i) => [h, values[i]]),
    );

    return {
      id: row.id,
      x: Number(row.x),
      y: Number(row.y),
      timestamp: new Date(row.timestamp ?? Date.now()).toISOString(),
      isEnabled: row.isEnabled === "true",
      wifiData: {
        ssid: row.ssid,
        bssid: row.bssid,
        rssi: Number(row.rssi),
        signalStrength: Number(row.signalQuality),
        channel: Number(row.channel),
        security: row.security,
        txRate: Number(row.txRate),
        phyMode: row.phyMode,
        channelWidth: Number(row.channelWidth),
        band: row.band,
      },
      iperfData: {
        tcpDownload: { bitsPerSecond: Number(row.tcpDownloadMbps) * 1e6 },
        tcpUpload: { bitsPerSecond: Number(row.tcpUploadMbps) * 1e6 },
        udpDownload: { bitsPerSecond: Number(row.udpDownloadMbps) * 1e6 },
        udpUpload: { bitsPerSecond: Number(row.udpUploadMbps) * 1e6 },
      },
    } as unknown as SurveyPoint;
  });

  // Filter out points with duplicate IDs
  const uniquePoints = parsedPoints.filter(
    (p) => !existingPoints.some((existing) => existing.id === p.id)
  );

  return uniquePoints;
};

  
  
  
  

  return (
    <div className="space-y-4">
      
      {pendingImport && (
        //handles the importing csv ui eliments 
    <AlertDialogModal
      title="Import Survey Points"
      description={`You are importing ${pendingImport.length} points. What would you like to do?`}
      onConfirm={() => {
        // default confirm = ADD
        pendingImport.forEach((p) => surveyPointActions.create(p));
        setPendingImport(null);
      }}
      onCancel={() => setPendingImport(null)}
    >
      <div className="flex justify-end gap-2">
      <Button
        variant="destructive"
        onClick={() => {
          if (!data || data.length === 0) return;

          // 1. Delete all existing points
          surveyPointActions.delete(data);

          // 2. Add the imported points
          pendingImport?.forEach((point) => surveyPointActions.add(point));

          // 3. Clear pending import
          setPendingImport(null);
        }}
        >
          Replace Existing
        </Button>

          
        <Button
          onClick={() => {
            // ADD
            pendingImport.forEach((p) => surveyPointActions.add(p));
            setPendingImport(null);
          }}
        >
          Add to Existing
        </Button>
      </div>
    </AlertDialogModal>
  )}
      <div className="text-2xl font-bold mt-4">Survey Points</div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <span className="text-md text-gray-700 min-w-fit">
            {Object.keys(rowSelection).length} of {flattenedData.length} row(s)
            selected
          </span>
        </div>
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Show Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.columnDef.header?.toString() ?? column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.toggleAllRowsSelected(false)}
            disabled={Object.keys(rowSelection).length === 0}
          >
            Deselect All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.toggleAllRowsSelected(true)}
          >
            Select All
          </Button>
          <AlertDialogModal
            title="Delete Selected"
            description="Are you sure you want to delete the selected rows?"
            onConfirm={handleDelete}
            onCancel={() => {}}
            disabled={Object.keys(rowSelection).length === 0}
          >
            <Button
              variant="destructive"
              size="sm"
              className={`${Object.keys(rowSelection).length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Delete Selected
            </Button>
          </AlertDialogModal>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleDisableSelected}
            disabled={Object.keys(rowSelection).length === 0}
          >
            Toggle Disable Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={
            table.getFilteredRowModel().rows.length === 0
            }
          >
            Export CSV
          </Button>
          <>
          <input
            type="file"
            accept=".csv"
            hidden
            id="csv-import"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const points = await parseCsv(file,data);
              setPendingImport(points);
              e.target.value = "";
            }}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("csv-import")?.click()}
          >
            Import CSV
          </Button>
          </>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: `${
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          } flex items-center justify-center whitespace-nowrap`,
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <ChevronUp className="ml-2 h-4 w-4" />,
                          desc: <ChevronDown className="ml-2 h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ??
                          (header.column.getCanSort() ? (
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          ) : null)}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${
                    row.getIsSelected()
                      ? "bg-primary/10"
                      : i % 2 === 0
                        ? "bg-muted/50"
                        : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default SurveyPointsTable;
