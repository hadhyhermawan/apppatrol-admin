export const getPhotoUrl = (folder: string, filename: string | null | undefined) => {
    if (!filename) return null;
    // Assuming backend URL is configurable or hardcoded for now
    // You might want to pull this from env variables later
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://k3guard.com:8000';

    // Check if filename is already a full URL
    if (filename.startsWith('http')) return filename;

    // Construct URL
    // Adjust logic based on your backend static file serving
    // Example: BASE_URL + '/static/' + folder + '/' + filename
    // Or if backend returns relative path including folder

    return `${BASE_URL}/uploads/${folder ? folder + '/' : ''}${filename}`;
};

export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return dateString;
    }
};
