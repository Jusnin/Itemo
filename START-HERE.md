# ITEMO! — how to run the demo

**The quickest way to see ITEMO! is to open it on your phone:**

> ## https://jusnin.github.io/Itemo/

Nothing to install. Add it to your home screen and it behaves like an app, and the
data stays private to your own phone.

The rest of this page is for running it from your own laptop instead — useful with
no internet, or to show it from a computer screen. You need a laptop, a phone, and
about five minutes the first time.

---

## 1. Install Node.js (once)

Download the **LTS** version from **https://nodejs.org** and install it with the
default options. If you already have it, skip this step.

## 2. Start ITEMO

- **Mac** — double-click **`start-mac.command`**
- **Windows** — double-click **`start-windows.bat`**

The first run installs the app and takes a few minutes. A window will stay open
showing progress — that is normal, leave it open.

> **Mac:** you may see "Do you want the application node to accept incoming
> network connections?" Click **Allow**. Without this your phone cannot connect.

## 3. Open it on your phone

When it is ready you will see a square barcode (a QR code) in the window, like this:

```
  ITEMO is running.

  On this computer:  http://localhost:3000
  On your phone:     http://192.168.1.42:3000

  ▄▄▄▄▄▄▄ ▄  ▄▄ ▄▄▄▄▄▄▄
  █ ▄▄▄ █ ▀█▄▀▄ █ ▄▄▄ █
  ...
```

Point your **phone camera** at the QR code and tap the link that appears.

**Your phone and your laptop must be on the same wifi.**

## 4. Stopping it

Close the window, or press **Ctrl + C** in it.

---

## If something goes wrong

**The phone cannot open the link.**
Some office and hotel wifi networks block phones from talking to laptops. Two
fixes, in order:

1. Turn on your phone's **personal hotspot** and connect the laptop to it, then
   restart ITEMO so it picks up the new address.
2. Open a second window in the same folder and run `npm run share`. This prints a
   web link that works from any network.

**The QR code never appears.**
Make sure the laptop is connected to wifi, then close the window and start again.

**I want to start fresh before showing someone.**
Tap **Reset demo data** at the bottom of the home screen. This restores the
original demo items and removes anything added during testing. Do this before
each demo.

---

## What to show

The app does three things, in this order:

1. **Add Item** — photograph a product. The name and category fill in
   automatically; you confirm or correct them before saving.
2. **Find Item** — search by name or category and see your own saved photos.
3. **My Stock** — see what is left and tap − or + as you use or buy things.

Tapping any item shows its purchase history, including separate expiry dates for
items bought at different times.
