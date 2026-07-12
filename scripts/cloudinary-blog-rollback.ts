import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { validateConfig, ManifestState, delay, saveManifest } from "./lib/cloudinary-blog-utils";

async function main() {
  const args = process.argv.slice(2);
  const manifestArgIndex = args.indexOf("--manifest");
  if (manifestArgIndex === -1 || !args[manifestArgIndex + 1]) {
    console.error("Please provide --manifest <path>");
    process.exit(1);
  }

  const manifestPath = path.resolve(args[manifestArgIndex + 1]);
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const manifestDir = path.dirname(manifestPath);
  const manifestState: ManifestState = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  
  const isDryRun = args.includes("--dry-run");

  validateConfig(); // Need credentials for rollback

  const renamedAssets = manifestState.assets.filter(a => a.status === "renamed");
  if (renamedAssets.length === 0) {
    console.log("No assets were renamed. Nothing to rollback on Cloudinary.");
  } else {
    console.log(`Found ${renamedAssets.length} assets to rollback.`);
    
    // Preflight check for rollback
    console.log("[Preflight] Checking if current assets exist to rollback...");
    for (const asset of renamedAssets) {
      try {
        await cloudinary.api.resource(asset.newPublicId);
      } catch (e: any) {
        if (e?.http_code === 404 || e?.error?.http_code === 404) {
          console.error(`[Preflight Error] Asset to rollback does not exist: ${asset.newPublicId}`);
          process.exit(1);
        }
        throw e;
      }
    }
  }

  if (isDryRun) {
    console.log("\n[Dry Run] Planned rollbacks:");
    for (const asset of renamedAssets) {
      console.log(`  ${asset.newPublicId} -> ${asset.oldPublicId}`);
    }
    console.log("\nRun without --dry-run to execute.");
    process.exit(0);
  }

  manifestState.status = "rolling-back";
  saveManifest(manifestDir, manifestState);

  let hasError = false;
  for (const asset of renamedAssets) {
    console.log(`[Rollback] ${asset.newPublicId} -> ${asset.oldPublicId}`);
    
    try {
      await cloudinary.uploader.rename(asset.newPublicId, asset.oldPublicId, {
        overwrite: false,
        invalidate: true
      });
      asset.status = "rolled-back";
      saveManifest(manifestDir, manifestState);
      await delay(250);
    } catch (e: any) {
      console.error(`[Error] Failed to rollback ${asset.newPublicId}:`, e.message);
      hasError = true;
      break;
    }
  }

  if (hasError) {
    console.log("\n[Halted] Rollback halted due to errors.");
    process.exit(1);
  }

  // Restore source file
  const beforeFile = path.join(manifestDir, "posts.before.ts");
  const sourceFile = path.join(process.cwd(), "data", "posts.ts");
  
  if (fs.existsSync(beforeFile)) {
    console.log("[Source] Restoring data/posts.ts from backup...");
    fs.copyFileSync(beforeFile, sourceFile);
  }

  manifestState.status = "rolled-back";
  saveManifest(manifestDir, manifestState);
  console.log("\n[Success] Rollback completed.");
}

main().catch(err => {
  console.error("Unhandled Error:", err);
  process.exit(1);
});
