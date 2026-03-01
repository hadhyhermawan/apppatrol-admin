"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Swal from "sweetalert2";
import apiClient from "@/lib/api";
import { Briefcase } from "lucide-react";

export type JabatanItem = {
    kode_jabatan: string;
    nama_jabatan: string;
    vendor_id?: number | null;
    created_at?: string;
    updated_at?: string;
};

type Props = {
    data: JabatanItem[];
    vendors: { value: string; label: string }[];
    onUpdate: () => void;
};

export default function JabatanBoard({ data, vendors, onUpdate }: Props) {
    const [isBrowser, setIsBrowser] = useState(false);
    const [columns, setColumns] = useState<Record<string, JabatanItem[]>>({});

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    useEffect(() => {
        // Group data
        const initialCols: Record<string, JabatanItem[]> = {
            "unassigned": []
        };
        vendors.forEach(v => {
            initialCols[v.value] = [];
        });

        data.forEach(item => {
            const vId = item.vendor_id ? String(item.vendor_id) : "unassigned";
            if (initialCols[vId]) {
                initialCols[vId].push(item);
            } else {
                initialCols["unassigned"].push(item);
            }
        });

        setColumns(initialCols);
    }, [data, vendors]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Optimistically update
        const sourceId = source.droppableId;
        const destId = destination.droppableId;

        const startCol = [...columns[sourceId]];
        const finishCol = [...columns[destId]];

        const [movedItem] = startCol.splice(source.index, 1);

        // determine new vendor id
        const newVendorId = destId === "unassigned" ? null : parseInt(destId, 10);
        const updatedItem = { ...movedItem, vendor_id: newVendorId };

        if (sourceId === destId) {
            startCol.splice(destination.index, 0, updatedItem);
            setColumns(prev => ({ ...prev, [sourceId]: startCol }));
        } else {
            finishCol.splice(destination.index, 0, updatedItem);
            setColumns(prev => ({
                ...prev,
                [sourceId]: startCol,
                [destId]: finishCol
            }));
        }

        // Call API to update the item
        try {
            await apiClient.put(`/master/jabatan/${updatedItem.kode_jabatan}`, {
                kode_jabatan: updatedItem.kode_jabatan,
                nama_jabatan: updatedItem.nama_jabatan,
                vendor_id: updatedItem.vendor_id
            });
            // Update parent data on background
            onUpdate();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || "Gagal mengubah vendor jabatan.", 'error');
            // Revert changes by triggering fetch
            onUpdate();
        }
    };

    if (!isBrowser) return null;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6 items-start h-full" style={{ minHeight: "calc(100vh - 220px)" }}>
                {/* Unassigned column */}
                <BoardColumn
                    id="unassigned"
                    title="Tanpa Vendor (GLOBAL)"
                    items={columns["unassigned"] || []}
                    isUnassigned
                />

                {/* Vendor Columns */}
                {vendors.map(vendor => (
                    <BoardColumn
                        key={vendor.value}
                        id={vendor.value}
                        title={vendor.label}
                        items={columns[vendor.value] || []}
                    />
                ))}
            </div>
        </DragDropContext>
    );
}

function BoardColumn({ id, title, items, isUnassigned }: { id: string, title: string, items: JabatanItem[], isUnassigned?: boolean }) {
    return (
        <div className={`w-[300px] shrink-0 rounded-xl border flex flex-col h-[calc(100vh-250px)] ${isUnassigned ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30' : 'bg-gray-50 border-gray-200 dark:bg-meta-4/50 dark:border-strokedark'}`}>
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 rounded-t-xl backdrop-blur-md ${isUnassigned ? 'border-blue-200 bg-blue-100/50 dark:border-blue-800/30 dark:bg-blue-900/20' : 'border-gray-200 bg-gray-100/50 dark:border-strokedark dark:bg-[#252b36]/50'}`}>
                <h3 className="font-semibold text-black dark:text-white flex items-center gap-2 text-sm">
                    <Briefcase className={`w-4 h-4 ${isUnassigned ? 'text-blue-500' : 'text-brand-500'}`} />
                    {title}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${isUnassigned ? 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-white text-brand-500 dark:bg-boxdark'}`}>
                    {items.length}
                </span>
            </div>

            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[150px] transition-colors rounded-b-xl custom-scrollbar ${snapshot.isDraggingOver ? "bg-brand-50/50 dark:bg-brand-500/10" : ""
                            }`}
                    >
                        {items.map((item, index) => (
                            <Draggable key={item.kode_jabatan} draggableId={item.kode_jabatan} index={index}>
                                {(provided, drgSnapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white dark:bg-boxdark p-4 rounded-lg shadow-sm border ${drgSnapshot.isDragging ? "border-brand-500 shadow-xl ring-2 ring-brand-500/20 rotate-1 scale-105 z-50" : "border-stroke dark:border-strokedark hover:border-brand-300 focus:border-brand-300 transition-all hover:-translate-y-1 hover:shadow-md"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700 dark:bg-meta-4 dark:text-gray-300 border border-gray-200 dark:border-gray-700 tracking-wider">
                                                {item.kode_jabatan}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-sm text-black dark:text-white leading-snug">
                                            {item.nama_jabatan}
                                        </h4>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
