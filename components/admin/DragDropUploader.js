function DragDropUploader({ onUploadComplete, type = 'image' }) {
    const [uploading, setUploading] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [error, setError] = React.useState("");

    const handleDrop = async (event) => {
        event.preventDefault();
        setUploading(true);
        setMessage("");
        setError("");

        const file = event.dataTransfer.files[0];
        if (!file) {
            setError("No file selected");
            setUploading(false);
            return;
        }

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validModelTypes = ['model/gltf-binary', 'model/gltf+json', '.glb', '.gltf'];
        const fileType = file.type.toLowerCase();
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (type === 'image' && !validImageTypes.includes(fileType)) {
            setError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
            setUploading(false);
            return;
        }

        if (type === 'model' && !validModelTypes.includes(fileType) && !validModelTypes.includes(`.${fileExtension}`)) {
            setError("Please upload a valid 3D model file (GLB or GLTF)");
            setUploading(false);
            return;
        }

        try {
            const storageRef = window.firebase.storage.ref();
            const folder = type === 'image' ? 'blogImages' : 'models';
            const fileRef = storageRef.child(`${folder}/${Date.now()}-${file.name}`);
            
            // Upload file
            await fileRef.put(file);
            const downloadUrl = await fileRef.getDownloadURL();

            // Call the callback with the download URL
            if (onUploadComplete) {
                onUploadComplete(downloadUrl);
            }

            setMessage(`${type === 'image' ? 'Image' : 'Model'} uploaded successfully!`);
        } catch (err) {
            console.error("Upload error:", err);
            setError("Upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-4 border-dashed border-gray-300 p-10 text-center rounded-lg hover:border-gray-400 transition-colors"
        >
            {uploading ? (
                <div className="flex flex-col items-center">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Uploading...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <i className={`fas ${type === 'image' ? 'fa-image' : 'fa-cube'} text-3xl mb-2 text-gray-400`}></i>
                    <p className="text-gray-600">
                        Drag & drop a {type === 'image' ? 'image' : '3D model'} file here
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {type === 'image' 
                            ? 'Supported formats: JPEG, PNG, GIF, WebP'
                            : 'Supported formats: GLB, GLTF'
                        }
                    </p>
                </div>
            )}
            {message && (
                <p className="mt-4 text-sm text-green-600">
                    <i className="fas fa-check-circle mr-1"></i>
                    {message}
                </p>
            )}
            {error && (
                <p className="mt-4 text-sm text-red-600">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {error}
                </p>
            )}
        </div>
    );
}

// Make DragDropUploader component available globally
window.DragDropUploader = DragDropUploader; 