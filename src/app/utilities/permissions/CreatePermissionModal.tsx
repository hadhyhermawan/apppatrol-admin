import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import apiClient from "@/lib/api";

interface CreatePermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    groups: { id: number; name: string }[];
}

export default function CreatePermissionModal({ isOpen, onClose, onSuccess, groups }: CreatePermissionModalProps) {
    const [name, setName] = useState("");
    const [groupId, setGroupId] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName("");
            setGroupId("");
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !groupId) {
            Swal.fire("Error", "Mohon lengkapi semua field", "error");
            return;
        }

        setLoading(true);
        try {
            await apiClient.post("/utilities/permissions", {
                name: name,
                id_permission_group: parseInt(groupId)
            });

            Swal.fire("Sukses", "Permission berhasil ditambahkan", "success");
            onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error?.response?.data?.detail || "Gagal menambahkan permission";
            Swal.fire("Error", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 md:p-9">
            <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-boxdark">
                <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
                    <h3 className="text-xl font-semibold text-black dark:text-white">
                        Tambah Permission
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black dark:hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Nama Permission <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: create-user (huruf kecil)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                        <p className="mt-1 text-xs text-gray-500">Gunakan huruf kecil dan tanda hubung (-)</p>
                    </div>

                    <div className="mb-6">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Group Permission <span className="text-meta-1">*</span>
                        </label>
                        <div className="relative z-20 bg-transparent dark:bg-form-input">
                            <select
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="" disabled>Pilih Group</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
                                <svg
                                    className="fill-current"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <g opacity="0.8">
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                                            fill=""
                                        ></path>
                                    </g>
                                </svg>
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

