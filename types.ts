// FIX: Removed a self-referential import of `AttendanceRecord` from this file.

export interface AttendanceRecord {
    id: string;
    firstname: string;
    middle: string;
    lastname: string;
    sex: string;
    do_you_have_any_disability: string;
    if_yes_type_of_disability: string;
    home_address: string;
    phone_no: string;
    email: string;
    highest_qualification: string;
    employment_type: string;
    employment_status: string;
}

export interface ProcessingFile {
  file: File;
  url: string;
  hash: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}
