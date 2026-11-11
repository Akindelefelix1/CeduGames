# Firebase live push setup

This repository is wired for Firebase Cloud Messaging (FCM). The player app registers its FCM token with the backend after sign-in; the admin backend sends messages using the FCM HTTP v1 API. Complete these steps to activate real device delivery.

## 1. Create or choose a Firebase project

1. Open the [Firebase console](https://console.firebase.google.com/) and create or select the CeduGames project.
2. In **Project settings → General**, note the **Project ID**. The backend needs this exact value as `FCM_PROJECT_ID` (not the project number).
3. In **Project settings → Cloud Messaging**, make sure the **Firebase Cloud Messaging API (V1)** is enabled. The server uses the HTTP v1 API, which requires an authenticated service account. [Firebase server setup](https://firebase.google.com/docs/cloud-messaging/server-environment)

## 2. Register the Android app

1. In Firebase project settings, choose **Add app → Android**.
2. Enter Android package name `com.cedugames`. This must match `applicationId` in `android/app/build.gradle`.
3. Download `google-services.json` and place it at:

   `CeduApp/android/app/google-services.json`

   Keep the file associated with this Firebase project and app ID. The Google Services Gradle plugin is already configured to activate when this file exists. Firebase’s Android setup also describes downloading this config file. [Add Firebase to Android](https://firebase.google.com/docs/android/setup)

## 3. Register the iOS app (if shipping iOS)

1. Choose **Add app → iOS** and use bundle identifier `com.cedugames` (already set in `ios/CeduGames.xcodeproj`).
2. Download `GoogleService-Info.plist`, add it to `ios/CeduGames/`, and add it to the `CeduGames` target in Xcode.
3. In the Apple Developer account, create an APNs authentication key with Apple Push Notifications enabled. In Firebase, open **Project settings → Cloud Messaging → Apple app configuration**, select this iOS app, and upload the `.p8` key with its Key ID and Team ID.
4. Open the Xcode workspace, select the `CeduGames` target, and enable **Push Notifications** plus **Background Modes → Remote notifications**. iOS delivery requires APNs configuration and a real device for the usual end-to-end test. [React Native Firebase iOS messaging setup](https://rnfirebase.io/messaging/usage/ios-setup)

## 4. Install native dependencies

The Firebase packages are already in `package.json`.

- **Android:** adding `google-services.json` is enough for the Gradle plugin to configure the Firebase app on the next native build.
- **iOS:** on a Mac, run `cd ios; pod install`, then rebuild the iOS target. [React Native Firebase installation](https://rnfirebase.io/messaging/usage)

## 5. Give the backend permission to send

1. In Firebase **Project settings → Service accounts**, create/download a private service-account JSON key. Keep it private: do not commit it, send it in chat, or put it in the mobile app.
2. In Google Cloud IAM for the Firebase project, grant that service account the **Firebase Cloud Messaging API Admin** role. Use a service account from the same Firebase project where possible. [FCM send authorization](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk)
3. In the backend host’s environment settings (the backend currently points to Render), add:

   - `FCM_PROJECT_ID`: the Project ID from Step 1.
   - `FCM_SERVICE_ACCOUNT_JSON`: the complete contents of the service-account JSON key, stored as a secret.

   Do not add either value to the admin or mobile app environment. The backend `.env.example` documents these variables.

## 6. Deploy the backend

Deploy the backend changes after setting the two secrets. Its production start command runs `npm run migrate` before the server starts, which applies migration `059_push_notifications.sql` and creates device-token storage and scheduled-campaign fields. Check the backend logs for a successful migration and server startup.

**Production scheduling requirement:** the current `Cedugames_BE/render.yaml` sets the backend web service to Render's `free` plan. Free web services sleep after 15 minutes without inbound traffic, and the in-process due-notification worker sleeps with them. A scheduled campaign can therefore be late. Before relying on schedules in production, either upgrade the backend web service to an always-on plan, or create a Render Cron Job using the same backend repository and set its schedule to `* * * * *`, build command to `npm ci --include=dev && npm run build`, and command to `npm run dispatch:push`. Share the backend's production environment group with the Cron Job (including `DATABASE_URL`, `JWT_SECRET`, `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON`, and the other production configuration values required by the backend). The one-shot dispatcher shares database locks with the web worker, so only one process sends each campaign. Render Cron Jobs have a minimum monthly charge; see [Render Cron Job docs](https://render.com/docs/cronjobs). [Render Free service limits](https://render.com/docs/free)

## 7. Build and upload the Android app

1. In `android/app/build.gradle`, increase `versionCode` from `6` to a value higher than the latest version in Play Console. Set `versionName` to the release version you want to show users.
2. Confirm the existing release signing values in the ignored `android/keystore.properties` still point to the Play upload keystore. Never replace or lose the keystore used for the existing Play app.
3. From PowerShell in the app project, build the Play bundle:

   ```powershell
   Set-Location C:\Users\akind\Desktop\CeduApp\android
   .\gradlew.bat bundleRelease
   ```

4. Find the generated bundle at `android/app/build/outputs/bundle/release/app-release.aab`.
5. Upload it in Play Console to an **Internal testing** track first. Install that release from the tester opt-in link on a physical Android device. A sideloaded debug build can test Firebase token registration too, but the Play internal track verifies the signed release that will be promoted.

## 8. Send a real test campaign

1. Install/open the updated app, sign into a player account, and allow notifications when Android prompts. Android 13 and newer require the user to grant notification permission; the app requests it after sign-in. [Android notification permission](https://firebase.google.com/docs/cloud-messaging/android/get-started#request_runtime_notification_permission_on_android_13)
2. In the admin app, open **Notifications → Send New Notification**, enter a title and message, choose the audience/players, and send immediately.
3. Check **Notifications → Push campaigns**. `sent` with a positive “ok” count means FCM accepted delivery for registered devices. `sent` with zero means no matching devices have registered yet. `not_configured` means backend Firebase secrets are missing; `failed` or a nonzero failure count indicates token/configuration or delivery errors.
4. Test both foreground (the app shows an alert) and background/closed states (Android displays the notification). Confirm the matching in-app notification also appears in the player notification centre.

## Common checks

- Android Firebase app package, Play app package, and `applicationId` must all be `com.cedugames`.
- Use the Firebase **Project ID** consistently for the Android config, backend `FCM_PROJECT_ID`, and service account permissions.
- If no device is registered, sign in again using the new native build and accept the notification permission prompt.
- If a campaign says `not_configured`, check both backend secrets and redeploy/restart the backend.
- Keep service-account JSON and Play upload keystore credentials private. The Android Firebase config file is app configuration, but keep it in the correct app project and follow your organization’s source-control policy.
