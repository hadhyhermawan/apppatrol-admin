"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Swal from "sweetalert2";
import apiClient from "@/lib/api";
import { MapPin, Building, Phone } from "lucide-react";

export type CabangItem = {
    kode_cabang: string;
    nama_cabang: string;
    alamat_cabang: string;
    telepon_cabang: string;
    lokasi_cabang: string;
    radius_cabang: number;
    kode_up3: string | null;
    vendor_id?: number | null;
    created_at?: string;
    updated_at?: string;
};

type Props = {
    data: CabangItem[];
    vendors: { value: string; label: string }[];
    onUpdate: () => void;
};

export default function CabangBoard({ data, vendors, onUpdate }: Props) {
    const [isBrowser, setIsBrowser] = useState(false);
    const [columns, setColumns] = useState<Record<string, CabangItem[]>>({});

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    useEffect(() => {
        // Group data
        const initialCols: Record<string, CabangItem[]> = {
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
            await apiClient.put(`/master/cabang/${updatedItem.kode_cabang}`, {
                kode_cabang: updatedItem.kode_cabang,
                nama_cabang: updatedItem.nama_cabang,
                alamat_cabang: updatedItem.alamat_cabang,
                telepon_cabang: updatedItem.telepon_cabang,
                lokasi_cabang: updatedItem.lokasi_cabang,
                radius_cabang: updatedItem.radius_cabang,
                kode_up3: updatedItem.kode_up3,
                vendor_id: updatedItem.vendor_id
            });
            // Update parent data on background
            onUpdate();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || "Gagal mengubah vendor cabang.", 'error');
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
                    title="Tanpa Vendor"
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

function BoardColumn({ id, title, items, isUnassigned }: { id: string, title: string, items: CabangItem[], isUnassigned?: boolean }) {
    return (
        <div className={`w-[340px] shrink-0 rounded-xl border flex flex-col h-[calc(100vh-250px)] ${isUnassigned ? 'bg-gray-100/80 border-gray-300 dark:bg-meta-4/20 dark:border-strokedark' : 'bg-gray-50 border-gray-200 dark:bg-meta-4/50 dark:border-strokedark'}`}>
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 rounded-t-xl backdrop-blur-md ${isUnassigned ? 'border-gray-300 bg-gray-200/50 dark:border-strokedark dark:bg-meta-4/50' : 'border-gray-200 bg-gray-100/50 dark:border-strokedark dark:bg-[#252b36]/50'}`}>
                <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
                    <Building className={`w-4 h-4 ${isUnassigned ? 'text-gray-500' : 'text-brand-500'}`} />
                    {title}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${isUnassigned ? 'bg-gray-300 text-gray-700 dark:bg-meta-4 dark:text-gray-300' : 'bg-white text-brand-500 dark:bg-boxdark'}`}>
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
                            <Draggable key={item.kode_cabang} draggableId={item.kode_cabang} index={index}>
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
                                                {item.kode_cabang}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-base text-black dark:text-white mb-2 leading-snug">
                                            {item.nama_cabang}
                                        </h4>
                                        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-[12px] text-gray-500 dark:text-gray-400 flex items-start gap-1.5 line-clamp-2 leading-relaxed">
                                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                                                {item.alamat_cabang}
                                            </p>
                                            {item.telepon_cabang && (
                                                <p className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                    {item.telepon_cabang}
                                                </p>
                                            )}
                                        </div>
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
