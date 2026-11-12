# Folio mobile app (Flutter WebView)

Wraps the live Folio web app in a native Android / iOS shell with a loading bar,
an offline screen, and Android back-button support.

## Build it (5 minutes)

```bash
flutter create folio_app
cd folio_app
flutter pub add webview_flutter
```

1. Replace the generated `lib/main.dart` with `flutter-webview/lib/main.dart` from this project.
2. Open `lib/main.dart` and set `folioUrl` to your Folio URL.
3. **Android:** open `android/app/src/main/AndroidManifest.xml` and add this line inside `<manifest>` (above `<application>`):

   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```

   (Flutter only adds it to debug builds by default — release builds need it too.)
4. **iOS:** nothing extra is needed for an HTTPS URL.
5. Run it:

   ```bash
   flutter run                      # on a connected phone / emulator
   flutter build apk --release      # Android APK
   flutter build appbundle          # Google Play
   flutter build ipa                # App Store (needs a Mac + Xcode)
   ```

## App icon and name

```bash
flutter pub add --dev flutter_launcher_icons
```

Point `flutter_launcher_icons` at `public/icons/icon-512.png` (the Folio mark) and run
`dart run flutter_launcher_icons`. Set the display name in `AndroidManifest.xml`
(`android:label`) and `ios/Runner/Info.plist` (`CFBundleDisplayName`).

## Good to know

- **Sign-in persists.** Folio uses a secure HTTP-only cookie that WebView keeps for 30 days.
- **The sandbox preview URL is temporary.** Deploy Folio to Vercel or Render (root README)
  and paste the permanent URL into `folioUrl` before you publish the app.
- **Mobile-tuned.** Inputs use 16px text (no iOS auto-zoom), touch targets are enlarged,
  and the layout respects notch / home-indicator safe areas.
- If you ever enable deep links or external links, handle them in `onNavigationRequest`
  with the `url_launcher` package.
