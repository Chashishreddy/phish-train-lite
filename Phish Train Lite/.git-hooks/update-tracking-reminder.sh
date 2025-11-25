#!/bin/bash

# Pre-commit hook to remind about updating TRACK-APPLICATION.md

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  REMINDER: Update TRACK-APPLICATION.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Have you updated the tracking document?"
echo ""
echo "Required updates:"
echo "  1. Update date and version number"
echo "  2. Add to Recent Changes section"
echo "  3. Update statistics if numbers changed"
echo "  4. Check off completed features"
echo "  5. Add new features to appropriate category"
echo ""
echo "File: TRACK-APPLICATION.md"
echo ""
echo "Press ENTER to continue commit, or Ctrl+C to cancel..."
read

exit 0
