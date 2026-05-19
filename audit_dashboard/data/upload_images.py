import boto3
import os

s3 = boto3.client(
    "s3",
    endpoint_url="https://9a927e9ca2a345ae219c8f85224b5d00.r2.cloudflarestorage.com",
    aws_access_key_id="09d7285f012a405a0ea5b3ff2305cfb5",
    aws_secret_access_key="27c113c55d2f61107466c73a130a162cd7600aa335ae199d6dddbd29701cd945",
    region_name="auto"
)

BUCKET = "audit-dashboard"
LOCAL_FOLDER = r"N:\01.DESIGN LAB\25-06_BSF SMALL GRANTS PROGRAMME\02_Implementation\04_Dashboard\Decoding Stormwater Tools\02. Github Repo - DO NOT OPEN\mod-foundation\audit_dashboard\data\media_compressed"  # use raw string for Windows paths

def already_uploaded(r2_key, local_path):
    try:
        response = s3.head_object(Bucket=BUCKET, Key=r2_key)
        r2_size = response["ContentLength"]
        local_size = os.path.getsize(local_path)
        return r2_size == local_size
    except s3.exceptions.ClientError:
        return False  # file doesn't exist in R2

for root, dirs, files in os.walk(LOCAL_FOLDER):
    for filename in files:
        local_path = os.path.join(root, filename)
        r2_key = os.path.relpath(local_path, LOCAL_FOLDER).replace("\\", "/")

        if already_uploaded(r2_key, local_path):
            print(f"Skipping (already exists): {r2_key}")
        else:
            print(f"Uploading: {r2_key}")
            s3.upload_file(local_path, BUCKET, r2_key)

print("Done!")