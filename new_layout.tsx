return (
    <MainLayout>
        {/* Action Bar (Hidden on Print) */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <PageBreadcrumb pageTitle="Detail Presensi Karyawan" />
            <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-meta-4">
                    <button
                        onClick={() => setViewMode('table')}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            viewMode === 'table'
                                ? "bg-white text-black shadow-sm dark:bg-boxdark dark:text-white"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        Tabel
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            viewMode === 'calendar'
                                ? "bg-white text-black shadow-sm dark:bg-boxdark dark:text-white"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        Kalender
                    </button>
                </div>

                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm print:hidden"
                >
                    <Printer className="h-4 w-4" />
                    Cetak Laporan
                </button>

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 dark:bg-boxdark dark:text-gray-300 dark:border-strokedark dark:hover:bg-meta-4 print:hidden"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
            </div>
        </div>

        {previewImage && (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in print:hidden"
                onClick={() => setPreviewImage(null)}
            >
                <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
                />
            </div>
        )}

        <div id="print-area" className="bg-white text-black font-sans print:p-0 rounded-2xl print:rounded-none mx-auto max-w-[1200px]">

            {/* --- HEADER REPORT --- */}
            <div className="hidden print:flex mb-8 border-b-2 border-gray-800 pb-6 items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src="/images/logo/logo-kcd.png" alt="Company Logo" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">PLATARAN INDONESIA</h1>
                        <p className="text-sm text-gray-600 tracking-wide font-medium">Divisi Keamanan & Keselamatan Kerja</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-blue-800 uppercase tracking-widest bg-blue-50 px-4 py-1 rounded-full border border-blue-200 inline-block">Laporan Presensi</h2>
                    <p className="text-sm text-gray-600 mt-2 font-medium">Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
                </div>
            </div>

            {/* --- EMPLOYEE INFO --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8 print:p-0 print:gap-6 print:mb-8 bg-gray-50/50 rounded-2xl print:bg-transparent">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl bg-gray-200 overflow-hidden flex-shrink-0 shadow-sm print:h-20 print:w-20 print:shadow-none border border-gray-100 print:border-gray-200">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 print:bg-gray-50 print:text-gray-700">
                            <span className="text-3xl font-bold uppercase">{employee?.nama_karyawan?.charAt(0) || "U"}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl print:text-xl font-extrabold text-gray-900 mb-1 tracking-tight">
                            {employee?.nama_karyawan || "Memuat..."}
                        </h3>
                        <p className="font-mono text-sm text-gray-500 mb-3">{employee?.nik || "-"}</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white print:bg-transparent border border-gray-200 print:border-gray-300 rounded-full text-xs font-semibold text-gray-700">
                                {employee?.nama_jabatan || "-"}
                            </span>
                            <span className="px-3 py-1 bg-white print:bg-transparent border border-gray-200 print:border-gray-300 rounded-full text-xs font-semibold text-gray-700">
                                {employee?.nama_dept || "-"}
                            </span>
                            <span className="px-3 py-1 bg-white print:bg-transparent border border-gray-200 print:border-gray-300 rounded-full text-xs font-semibold text-gray-700">
                                {employee?.nama_cabang || "-"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
                    <div className="bg-white print:bg-transparent print:border print:border-gray-300 p-4 rounded-xl shadow-sm print:shadow-none border border-gray-100 flex flex-col justify-center items-center text-center print:rounded-lg">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Hadir</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-green-600 print:text-gray-900">{data.filter(d => d.status === 'h').length}</span>
                            <span className="text-xs font-medium text-gray-400 print:text-gray-600">hari</span>
                        </div>
                    </div>
                    <div className="bg-white print:bg-transparent print:border print:border-gray-300 p-4 rounded-xl shadow-sm print:shadow-none border border-gray-100 flex flex-col justify-center items-center text-center print:rounded-lg">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Terlambat</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-orange-500 print:text-gray-900">{data.filter(d => d.terlambat !== '-').length}</span>
                            <span className="text-xs font-medium text-gray-400 print:text-gray-600">kali</span>
                        </div>
                    </div>
                    <div className="bg-white print:bg-transparent print:border print:border-gray-300 p-4 rounded-xl shadow-sm print:shadow-none border border-gray-100 flex flex-col justify-center items-center text-center print:rounded-lg">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Alpha</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-red-500 print:text-gray-900">{data.filter(d => d.status === 'a').length}</span>
                            <span className="text-xs font-medium text-gray-400 print:text-gray-600">hari</span>
                        </div>
                    </div>
                    <div className="bg-white print:bg-transparent print:border print:border-gray-300 p-4 rounded-xl shadow-sm print:shadow-none border border-gray-100 flex flex-col justify-center items-center text-center print:rounded-lg">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Izin/Cuti</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-blue-600 print:text-gray-900">{data.filter(d => ['i', 'c', 's'].includes(d.status)).length}</span>
                            <span className="text-xs font-medium text-gray-400 print:text-gray-600">hari</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            {viewMode === 'calendar' ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,listMonth'
                        }}
                        initialDate={startDate}
                        events={events}
                        height="auto"
                        locale="id"
                        locales={[idLocale]}
                        buttonText={{
                            today: 'Hari Ini',
                            month: 'Bulan',
                            list: 'List'
                        }}
                    />
                </div>
            ) : (
                <div className="mt-4 print:mt-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 print:border print:border-gray-300 print:shadow-none overflow-hidden print:rounded-xl">
                        <table className="w-full text-sm text-left align-middle print:text-[10px] 2xl:text-base">
                            <thead className="bg-gray-50 text-gray-600 print:bg-gray-100 print:text-gray-900 font-bold text-xs uppercase tracking-wider border-b border-gray-200 print:border-b-2 print:border-gray-400">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 w-[5%] text-center align-middle">No</th>
                                    <th className="px-4 md:px-6 py-4 w-[15%] align-middle">Tanggal</th>
                                    <th className="px-4 md:px-6 py-4 w-[15%] align-middle">Jadwal</th>
                                    <th className="px-4 md:px-6 py-4 w-[20%] align-middle">Masuk</th>
                                    <th className="px-4 md:px-6 py-4 w-[20%] align-middle">Pulang</th>
                                    <th className="px-4 md:px-6 py-4 w-[10%] text-center align-middle">Terlambat</th>
                                    <th className="px-4 md:px-6 py-4 w-[15%] text-center align-middle">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Memuat data presensi...</td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50 print:bg-transparent">Tidak ada data untuk periode ini.</td>
                                    </tr>
                                ) : (
                                    data.map((item, key) => (
                                        <tr key={key} className="hover:bg-blue-50/50 print:bg-transparent print-no-break transition-colors striped-row print:striped-row align-middle">
                                            <td className="px-4 md:px-6 py-4 text-center text-gray-500 font-medium align-middle">
                                                {key + 1}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 align-middle">
                                                <div className="font-semibold text-gray-900">
                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium print:text-[9px]">
                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })}
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 align-middle">
                                                <div className="font-semibold text-gray-900">{item.nama_jam_kerja || "-"}</div>
                                                <div className="text-xs text-gray-500 font-mono tracking-tighter print:text-[9px]">{item.jam_masuk_jadwal} - {item.jam_pulang_jadwal}</div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold font-mono tracking-tight text-gray-900">{item.jam_in || "-"}</span>
                                                    {item.foto_in && (
                                                        <div className="print-img-container">
                                                            <img
                                                                onClick={() => setPreviewImage(getImageUrl(item.foto_in))}
                                                                src={getImageUrl(item.foto_in) || undefined}
                                                                alt="In"
                                                                className="h-10 w-10 print:h-8 print:w-8 rounded-[0.4rem] object-cover border border-gray-200 cursor-pointer hover:shadow-md hover:scale-110 ring-1 ring-black/5 transition-all print:border-gray-300"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold font-mono tracking-tight text-gray-900">{item.jam_out || "-"}</span>
                                                    {item.foto_out && (
                                                        <div className="print-img-container">
                                                            <img
                                                                onClick={() => setPreviewImage(getImageUrl(item.foto_out))}
                                                                src={getImageUrl(item.foto_out) || undefined}
                                                                alt="Out"
                                                                className="h-10 w-10 print:h-8 print:w-8 rounded-[0.4rem] object-cover border border-gray-200 cursor-pointer hover:shadow-md hover:scale-110 ring-1 ring-black/5 transition-all print:border-gray-300"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-center align-middle">
                                                {item.terlambat !== "-" ? (
                                                    <span className="text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-md text-xs print:bg-transparent print:border print:border-orange-500 print:text-orange-700">{item.terlambat}</span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-center align-middle">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {getStatusBadge(item.status)}
                                                    {item.keterangan && <span className="text-[10px] text-gray-500 italic max-w-[120px] text-center leading-tight print:text-[8px]">{item.keterangan}</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- FOOTER REPORT --- */}
            <div className="hidden print:flex mt-10 pt-6 justify-between text-sm break-inside-avoid px-2">
                <div className="text-gray-600 font-medium">
                    <p>Dicetak pada: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></p>
                    <p className="mt-1">Dicetak oleh: <span className="font-semibold text-gray-900">Admin System</span></p>
                </div>
                <div className="flex gap-20 text-center">
                    <div className="flex flex-col items-center">
                        <p className="text-gray-600 mb-20 font-medium">Mengetahui,</p>
                        <div className="w-48 border-b-2 border-gray-800 pb-1 font-bold text-gray-900">Manager Operasional</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-gray-600 mb-20 font-medium">Dibuat Oleh,</p>
                        <div className="w-48 border-b-2 border-gray-800 pb-1 font-bold text-gray-900">Tim HR / Admin</div>
                    </div>
                </div>
            </div>

        </div>

        <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait; 
                        margin: 15mm 10mm;
                    }
                    body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: 'Inter', 'Plus Jakarta Sans', sans-serif !important;
                    }
                    
                    /* Hide everything outside print area */
                    body > *:not(#__next), 
                    #__next > *:not(main),
                    .sidebar, header, .header-area {
                        display: none !important;
                    }
                    
                    /* Essential structural fixes */
                    main {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    #print-area {
                        display: block !important;
                        width: 100% !important;
                        color: black !important;
                        max-width: none !important;
                    }
                    
                    .print\\\\:hidden {
                        display: none !important;
                    }

                    .print\\\\:flex {
                        display: flex !important;
                    }

                    .print\\\\:block {
                        display: block !important;
                    }
                    
                    /* Table adjustments */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: auto !important; /* ensures columns adapt naturally but respects min width */
                    }
                    
                    th {
                        background-color: #f3f4f6 !important;
                        color: #111827 !important;
                        font-weight: 700 !important;
                    }

                    th, td {
                        padding: 6px 8px !important;
                        vertical-align: middle !important;
                    }
                    
                    /* Zebra striping for print - ensures readability and professional look */
                    .striped-row:nth-child(even) {
                        background-color: #f9fafb !important;
                    }
                    
                    /* Page Break Control */
                    .print-no-break, tr {
                        page-break-inside: avoid !important;
                    }
                    
                    .break-inside-avoid {
                        page-break-inside: avoid !important;
                    }
                    
                    /* Ensure Images Don't Break Rows Layout */
                    .print-img-container {
                        display: inline-block;
                        height: 32px;
                        width: 32px;
                        overflow: hidden;
                    }
                    
                    /* Badges for Print (Outline vs Fill based on ink save) */
                    .bg-green-100 { background-color: #dcfce7 !important; color: #166534 !important; border: 1px solid #bbf7d0 !important; }
                    .bg-red-100 { background-color: #fee2e2 !important; color: #991b1b !important; border: 1px solid #fecaca !important;}
                    .bg-blue-100 { background-color: #dbeafe !important; color: #1e3a8a !important; border: 1px solid #bfdbfe !important;}
                    .bg-orange-100 { background-color: #ffedd5 !important; color: #9a3412 !important; border: 1px solid #fed7aa !important;}
                    .bg-yellow-100 { background-color: #fef9c3 !important; color: #854d0e !important; border: 1px solid #fef08a !important;}
                    .bg-gray-100 { background-color: #f3f4f6 !important; color: #374151 !important; border: 1px solid #e5e7eb !important;}
                    .bg-purple-100 { background-color: #f3e8ff !important; color: #6b21a8 !important; border: 1px solid #e9d5ff !important;}
                }
            `}</style>
    </MainLayout >
);
