import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";
import { uploadImage } from "../../utils/imageUtils";

const PackageCreator = ({ addNotification }) => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState({ name: '', type: '', location: '', price: '', description: '', imageUrl: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPackages = async () => {
      const sqlQuery = 'SELECT * FROM package;';

      const { data, error } = await supabase
        .from("package")
        .select("*")
        .order("pkg_name", { ascending: true });
      if (error) {
        addNotification("Failed to fetch packages", "error");
      } else {
        console.log("Fetched packages:", data);
        setPackages(data);
      }
      console.log("Executing SQL query:", sqlQuery);
    };
    fetchPackages();
  }, [addNotification]);

  const handleSelectPackage = (pkg) => {
    const sqlQuery = `SELECT * FROM package WHERE pkg_id = ${pkg.pkg_id};`;

    setSelectedPackage({
      pkg_id: pkg.pkg_id,
      name: pkg.pkg_name,
      type: pkg.pkg_type,
      location: pkg.location,
      price: pkg.pkg_price,
      description: pkg.pkg_desc,
      imageUrl: pkg.image_url
    });
    setIsEditing(true);
    console.log("Selected package:", pkg);
    console.log("Executing SQL query:", sqlQuery);
  };

  const handleSavePackage = async () => {
    console.log("Saving package:", selectedPackage);

    if (!selectedPackage.name || !selectedPackage.type || !selectedPackage.location || !selectedPackage.price || !selectedPackage.description) {
      addNotification("All fields are required", "error");
      return;
    }
  
    if (isNaN(selectedPackage.price)) {
      addNotification("Price must be a number", "error");
      return;
    }

    let imageUrl = selectedPackage.imageUrl;

    if (selectedFile) {
      const { publicURL, error } = await uploadImage(selectedFile);
      if (error) {
        addNotification("Error uploading image: " + error, "error");
        return;
      }
      imageUrl = publicURL;
      console.log("Image uploaded:", publicURL);
    }

    const packageData = {
      pkg_name: selectedPackage.name,
      pkg_type: selectedPackage.type,
      location: selectedPackage.location,
      pkg_desc: selectedPackage.description,
      pkg_price: parseFloat(selectedPackage.price),
      image_url: imageUrl
    };

    console.log("Package data to be sent:", packageData);

    if (isEditing) {
      const sqlQuery = `UPDATE package SET pkg_name = '${packageData.pkg_name}', pkg_type = '${packageData.pkg_type}', location = '${packageData.location}', pkg_desc = '${packageData.pkg_desc}', pkg_price = ${packageData.pkg_price}, image_url = '${packageData.image_url}' WHERE pkg_id = ${selectedPackage.pkg_id};`;

      const { error } = await supabase
        .from('package')
        .update(packageData)
        .eq('pkg_id', selectedPackage.pkg_id);
      if (error) {
        addNotification("Error updating package: " + error.message, "error");
      } else {
        setPackages((prevPackages) =>
          prevPackages.map((pkg) =>
            pkg.pkg_id === selectedPackage.pkg_id ? { ...pkg, ...selectedPackage, imageUrl } : pkg
          )
        );
        addNotification("Package has been updated", "success");
      }
      console.log("Executing SQL query:", sqlQuery);
    } else {
      const sqlQuery = `INSERT INTO package (pkg_name, pkg_type, location, pkg_desc, pkg_price, image_url) VALUES ('${packageData.pkg_name}', '${packageData.pkg_type}', '${packageData.location}', '${packageData.pkg_desc}', ${packageData.pkg_price}, '${packageData.image_url}');`;

      const { data, error } = await supabase
        .from('package')
        .insert([packageData]);
      console.log("Supabase response:", data, error);
      if (error) {
        addNotification("Error adding package: " + error.message, "error");
      } else {
        console.log("New package added:", data);
        if (data && Array.isArray(data) && data.length > 0) {
          setPackages((prevPackages) => [...prevPackages, { ...selectedPackage, pkg_id: data[0].pkg_id, imageUrl }]);
          addNotification("Package has been added", "success");
        } else {
          console.error("Unexpected response format from Supabase:", data);
          addNotification("Unexpected response format from Supabase", "error");
        }
      }
      console.log("Executing SQL query:", sqlQuery);
    }
    setSelectedPackage({ name: '', type: '', location: '', price: '', description: '', imageUrl: '' });
    setSelectedFile(null);
    fileInputRef.current.value = null;
    setIsEditing(false);
    console.log("Package saved and state reset");
  };

  const handleDeletePackage = async () => {
    const sqlQuery = `DELETE FROM package WHERE pkg_id = ${selectedPackage.pkg_id};`;

    console.log("Deleting package:", selectedPackage);

    const { error } = await supabase
      .from('package')
      .delete()
      .eq('pkg_id', selectedPackage.pkg_id);
    if (error) {
      addNotification("Error deleting package: " + error.message, "error");
    } else {
      setPackages((prevPackages) =>
        prevPackages.filter((pkg) => pkg.pkg_id !== selectedPackage.pkg_id)
      );
      setSelectedPackage({ name: '', type: '', location: '', price: '', description: '', imageUrl: '' });
      setSelectedFile(null);
      fileInputRef.current.value = null;
      setIsEditing(false);
      addNotification("Package has been deleted", "success");
      console.log("Package deleted and state reset");
    }
    console.log("Executing SQL query:", sqlQuery);
  };

  const handleClearSelection = () => {
    console.log("Executing SQL query: CLEAR SELECTION");

    setSelectedPackage({ name: '', type: '', location: '', price: '', description: '', imageUrl: '' });
    setSelectedFile(null);
    fileInputRef.current.value = null;
    setIsEditing(false);
    console.log("Selection cleared");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    console.log("Selected file:", file);
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-gray-700 mb-6">Package Creator</h2>
      <div className="flex space-x-6">
        <div className="w-1/2 space-y-6">
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 font-medium">Package Name</label>
            <input
              type="text"
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter package name"
              value={selectedPackage.name}
              onChange={(e) =>
                setSelectedPackage((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 font-medium">Package Type</label>
            <input
              type="text"
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter package type"
              value={selectedPackage.type}
              onChange={(e) =>
                setSelectedPackage((prev) => ({ ...prev, type: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 font-medium">Location</label>
            <input
              type="text"
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter location"
              value={selectedPackage.location}
              onChange={(e) =>
                setSelectedPackage((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 font-medium">Price</label>
            <input
              type="text"
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter price"
              value={selectedPackage.price}
              onChange={(e) =>
                setSelectedPackage((prev) => ({ ...prev, price: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 font-medium">Package Description</label>
            <textarea
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter package description"
              rows="4"
              value={selectedPackage.description}
              onChange={(e) =>
                setSelectedPackage((prev) => ({ ...prev, description: e.target.value }))
              }
            ></textarea>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 font-medium">Upload Image</label>
            <input
              type="file"
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-200 ease-in-out"
              onClick={handleSavePackage}
            >
              {isEditing ? "Update Package" : "Create Package"}
            </button>
            {isEditing && (
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-200 ease-in-out"
                onClick={handleDeletePackage}
              >
                Delete Package
              </button>
            )}
            {selectedPackage && (
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-200 ease-in-out"
                onClick={handleClearSelection}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
        <div className="w-1/2 bg-gray-50 rounded-lg shadow-md border border-gray-300 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                {["Package Name", "Package Type", "Location", "Price", "Description"].map(
                  (header, idx) => (
                    <th key={idx} className="p-2 text-left font-semibold text-sm">
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr
                  key={pkg.pkg_id}
                  className="bg-white border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectPackage(pkg)}
                >
                  <td className="p-2 text-gray-700 truncate">{pkg.pkg_name}</td>
                  <td className="p-2 text-gray-700 truncate">{pkg.pkg_type}</td>
                  <td className="p-2 text-gray-700 truncate">{pkg.location}</td>
                  <td className="p-2 text-gray-700 truncate">₱{pkg.pkg_price}</td>
                  <td className="p-2 text-gray-700 truncate" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pkg.pkg_desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PackageCreator;