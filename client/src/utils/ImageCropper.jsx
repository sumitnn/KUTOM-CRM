import { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FiCrop, FiCheck, FiX } from 'react-icons/fi';
import ModalPortal from '../components/ModalPortal';

const ImageCropper = ({ 
  onCropComplete, 
  onCancel,
  aspectRatio = 1,
  minWidth = 100,
  minHeight = 100
}) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result);
    });
    reader.readAsDataURL(file);
  };

  // Get cropped image
  const getCroppedImg = () => {
    if (!imgRef.current || !completedCrop?.width || !completedCrop?.height) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.92);
    });
  };

  // Apply crop
  const handleApplyCrop = async () => {
    const croppedFile = await getCroppedImg();
    if (croppedFile) {
      onCropComplete(croppedFile);
    }
  };

  // If no image selected, show file input
  if (!imgSrc) {
    return (
      <ModalPortal>
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <FiX className="h-6 w-6 font-bold" />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <FiCrop className="w-6 h-6" />
                Select Image to Crop
              </h2>
              <p className="text-gray-600 mt-2">Choose an image to crop</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors">
              <label className="cursor-pointer block">
                <FiCrop className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <div className="text-lg font-semibold text-blue-600">Click to select image</div>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, WebP up to 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }

  // Show crop interface
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 relative">
          <button
            onClick={onCancel}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white p-1 rounded-full"
          >
            <FiX className="h-6 w-6 font-bold" />
          </button>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <FiCrop className="w-6 h-6" />
              Crop Image
            </h2>
            <p className="text-gray-600 mt-2">Drag to adjust crop area</p>
          </div>

          {/* Crop Area */}
          <div className="mb-6">
            <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                minWidth={minWidth}
                minHeight={minHeight}
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  className="max-w-full max-h-[400px]"
                />
              </ReactCrop>
            </div>
          </div>

          {/* Aspect Ratio Options */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Aspect Ratio
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 1, label: 'Square (1:1)' },
                { value: 4/3, label: 'Standard (4:3)' },
                { value: 16/9, label: 'Widescreen (16:9)' },
                { value: 0, label: 'Free' }
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    const newAspect = option.value === 0 ? undefined : option.value;
                    // Reset crop when changing aspect ratio
                    setCrop(undefined);
                    // You'll need to pass this back to parent if needed
                  }}
                  className={`px-3 py-2 text-sm rounded-lg font-medium ${
                    aspectRatio === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCrop}
              disabled={!completedCrop}
              className={`px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                !completedCrop
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              <FiCheck className="h-5 w-5" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ImageCropper;