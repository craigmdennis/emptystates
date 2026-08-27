/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** True when the request carries a verified Access token (or under `astro dev`). */
    admin: boolean;
  }
}
