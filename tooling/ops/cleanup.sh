#!/bin/bash

# Cleanup script for phyt.fun project
# This script cleans node_modules and other generated files while preserving Drizzle migration files

set -e

START_TIME=$(date +%s)

echo "Starting phyt.fun cleanup..."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/phyt_drizzle_backup_$TIMESTAMP"

echo "Backing up Drizzle migration files..."
mkdir -p "$BACKUP_DIR/migrations"
mkdir -p "$BACKUP_DIR/meta"

if [ -d "packages/data-access/src/db/drizzle" ]; then
    if find packages/data-access/src/db/drizzle -name "*.sql" -type f | grep -q .; then
        find packages/data-access/src/db/drizzle -name "*.sql" -type f -exec cp {} "$BACKUP_DIR/migrations/" \;
        echo "Backed up $(find "$BACKUP_DIR/migrations/" -type f | wc -l) migration files"
    fi

    if find packages/data-access/src/db/drizzle/meta -name "*.json" -type f | grep -q .; then
        find packages/data-access/src/db/drizzle/meta -name "*.json" -type f -exec cp {} "$BACKUP_DIR/meta/" \;
        echo "Backed up $(find "$BACKUP_DIR/meta/" -type f | wc -l) meta files"
    fi
fi

echo "Removing node_modules and generated files..."

PACKAGES_BEFORE=()
CLEANED_FILES_COUNT=0

echo "Finding node_modules directories..."
while IFS= read -r -d '' dir; do
    package_name=$(dirname "$dir" | sed 's|^\./||')
    PACKAGES_BEFORE+=("$package_name")
    file_count=$(find "$dir" -type f 2>/dev/null | wc -l)
    CLEANED_FILES_COUNT=$((CLEANED_FILES_COUNT + file_count))
done < <(find . -name "node_modules" -type d -print0)

find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

echo "Removing build outputs and cache directories..."
for pattern in "dist" "build" ".next" ".turbo" ".cache"; do
    while IFS= read -r -d '' dir; do
        if [ -n "$dir" ]; then
            file_count=$(find "$dir" -type f 2>/dev/null | wc -l)
            CLEANED_FILES_COUNT=$((CLEANED_FILES_COUNT + file_count))
        fi
    done < <(find . -name "$pattern" -type d -print0 2>/dev/null)
    find . -name "$pattern" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
done

echo "Installing fresh dependencies..."
pnpm install

# Check which packages were actually removed (not reinstalled)
PACKAGES_AFTER=()
while IFS= read -r -d '' dir; do
    package_name=$(dirname "$dir" | sed 's|^\./||')
    PACKAGES_AFTER+=("$package_name")
done < <(find . -name "node_modules" -type d -print0 2>/dev/null)

# Find packages that were not reinstalled
TRULY_REMOVED_PACKAGES=()
for package in "${PACKAGES_BEFORE[@]}"; do
    found=false
    for reinstalled in "${PACKAGES_AFTER[@]}"; do
        if [ "$package" = "$reinstalled" ]; then
            found=true
            break
        fi
    done
    if [ "$found" = false ]; then
        TRULY_REMOVED_PACKAGES+=("$package")
    fi
done

echo "Restoring Drizzle migration files..."
if [ -d "$BACKUP_DIR" ]; then
    mkdir -p packages/data-access/src/db/drizzle/meta

    if [ "$(ls -A "$BACKUP_DIR/migrations/" 2>/dev/null)" ]; then
        cp "$BACKUP_DIR/migrations/"*.sql packages/data-access/src/db/drizzle/ 2>/dev/null || true
        echo "Restored $(find "$BACKUP_DIR/migrations/" -type f 2>/dev/null | wc -l) migration files"
    fi

    if [ "$(ls -A "$BACKUP_DIR/meta/" 2>/dev/null)" ]; then
        cp "$BACKUP_DIR/meta/"*.json packages/data-access/src/db/drizzle/meta/ 2>/dev/null || true
        echo "Restored $(find "$BACKUP_DIR/meta/" -type f 2>/dev/null | wc -l) meta files"
    fi

    rm -rf "$BACKUP_DIR"
    echo "Cleaned up temporary backup files"
fi

END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - START_TIME))

echo ""
echo "Summary:"
echo "Elapsed time: ${ELAPSED_TIME} seconds"
echo "Packages cleaned and reinstalled: $((${#PACKAGES_BEFORE[@]} - ${#TRULY_REMOVED_PACKAGES[@]}))"

if [ ${#TRULY_REMOVED_PACKAGES[@]} -gt 0 ]; then
    echo "Packages permanently removed: ${#TRULY_REMOVED_PACKAGES[@]}"
    echo ""
    echo "Permanently removed packages:"
    for package in "${TRULY_REMOVED_PACKAGES[@]}"; do
        echo "  - $package"
    done
else
    echo "No packages were permanently removed"
fi
