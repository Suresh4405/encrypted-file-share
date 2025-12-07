export const downloadFile = async (fileId, filename) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/octet-stream'
  },
  credentials: 'include'
});
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Download failed with status ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return { 
      success: false, 
      error: error.message || 'Download failed' 
    };
  }
};

export const handleShareLink = async (fileId, expiryHours = 24) => {
  try {
    const response = await API.post(`/files/share/link/${fileId}`, {
      expiryHours: parseInt(expiryHours)
    });
    
    return response.data;
  } catch (error) {
    console.error('Share link error:', error);
    throw error;
  }
};