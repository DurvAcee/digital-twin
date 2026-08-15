import os
import shutil
import zipfile
import subprocess


def main():
    print("Creating Lambda deployment package...")

    # Clean up
    if os.path.exists("lambda-package"):
        shutil.rmtree("lambda-package")
    if os.path.exists("lambda-deployment.zip"):
        os.remove("lambda-deployment.zip")

    # Create package directory
    os.makedirs("lambda-package")

    # Install dependencies for Lambda runtime
    print("Installing dependencies for Lambda runtime...")
    installed = False

    try:
        docker_check = subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if docker_check.returncode == 0:
            print("Using Docker container for Lambda build...")
            subprocess.run(
                [
                    "docker",
                    "run",
                    "--rm",
                    "-v",
                    f"{os.getcwd()}:/var/task",
                    "--platform",
                    "linux/amd64",
                    "--entrypoint",
                    "",
                    "public.ecr.aws/lambda/python:3.13",
                    "/bin/sh",
                    "-c",
                    "pip install --target /var/task/lambda-package -r /var/task/requirements.txt --platform manylinux2014_x86_64 --only-binary=:all: --upgrade",
                ],
                check=True,
            )
            installed = True
    except Exception:
        pass

    if not installed:
        print("Docker daemon not running. Falling back to native uv cross-compilation (x86_64-unknown-linux-gnu)...")
        subprocess.run(
            [
                "uv",
                "pip",
                "install",
                "--target",
                "lambda-package",
                "-r",
                "requirements.txt",
                "--python-platform",
                "x86_64-unknown-linux-gnu",
                "--python-version",
                "3.13",
            ],
            check=True,
        )


    # Copy application files
    print("Copying application files...")
    for file in ["server.py", "lambda_handler.py", "context.py", "resources.py"]:
        if os.path.exists(file):
            shutil.copy2(file, "lambda-package/")
    
    # Copy data directory
    if os.path.exists("data"):
        shutil.copytree("data", "lambda-package/data")

    # Create zip
    print("Creating zip file...")
    with zipfile.ZipFile("lambda-deployment.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("lambda-package"):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, "lambda-package")
                zipf.write(file_path, arcname)

    # Show package size
    size_mb = os.path.getsize("lambda-deployment.zip") / (1024 * 1024)
    print(f"✓ Created lambda-deployment.zip ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()