from __future__ import print_function
import os
import io
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# If modifying these SCOPES, delete the token.json file
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

def authenticate():
    """Authenticate and return Google Drive service"""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials.json', SCOPES)
        creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('drive', 'v3', credentials=creds)

def list_files_in_folder(service, folder_id):
    """List all files in a specific Google Drive folder"""
    query = f"'{folder_id}' in parents and trashed = false"
    results = service.files().list(
        q=query,
        pageSize=100,
        fields="files(id, name, mimeType)"
    ).execute()
    return results.get('files', [])

def download_file(service, file, output_folder='output'):
    """Download file content and save metadata or content as JSON"""
    os.makedirs(output_folder, exist_ok=True)
    file_name = file['name']
    file_id = file['id']
    mime_type = file['mimeType']

    data = {"file_name": file_name, "file_id": file_id, "mime_type": mime_type}

    if mime_type == 'application/vnd.google-apps.document':
        # Export Google Doc as plain text
        request = service.files().export_media(fileId=file_id, mimeType='text/plain')
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        data['content'] = fh.getvalue().decode('utf-8')

    elif mime_type == 'application/vnd.google-apps.spreadsheet':
        # Export Google Sheet as CSV
        request = service.files().export_media(fileId=file_id, mimeType='text/csv')
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        data['content'] = fh.getvalue().decode('utf-8')

    else:
        # For other files, just download the raw file
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        raw_file_path = os.path.join(output_folder, file_name)
        with open(raw_file_path, 'wb') as f:
            f.write(fh.getvalue())
        data['downloaded'] = raw_file_path

    # Save metadata/content as JSON
    json_path = os.path.join(output_folder, f"{file_name}.json")
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(data, jf, ensure_ascii=False, indent=4)
    print(f"Saved JSON for {file_name}")

def main():
    folder_id = 'YOUR_FOLDER_ID_HERE'  # Replace with your folder ID
    service = authenticate()
    files = list_files_in_folder(service, folder_id)
    print(f"Found {len(files)} files in folder.")

    for f in files:
        download_file(service, f)

if __name__ == "__main__":
    main()
