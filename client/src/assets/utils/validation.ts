// utils/validation.ts
interface OrganizationData {
    organizationName: string;
    description: string;
    website: string;
    address: string;
    phone: string;
  }
  
  export const validateOrganizationData = (data: OrganizationData) => {
    const errors: Record<string, string> = {};
  
    if (!data.organizationName.trim()) {
      errors.organizationName = 'Organization name is required';
    } else if (data.organizationName.length < 2) {
      errors.organizationName = 'Organization name must be at least 2 characters';
    } else if (data.organizationName.length > 100) {
      errors.organizationName = 'Organization name cannot exceed 100 characters';
    }
  
    if (!data.description.trim()) {
      errors.description = 'Description is required';
    } else if (data.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (data.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
  
    if (data.website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(data.website)) {
      errors.website = 'Please enter a valid website URL';
    }
  
    if (data.address && data.address.length < 5) {
      errors.address = 'Address must be at least 5 characters';
    } else if (data.address && data.address.length > 200) {
      errors.address = 'Address cannot exceed 200 characters';
    }
  
    if (data.phone && !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(data.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
  
    return errors;
  };