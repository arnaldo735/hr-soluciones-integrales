import { CallerProfileCard, ChangePasswordCard } from "@/pages/SettingsPage";

/**
 * Pantalla de perfil accesible para todos los roles. Reúne las tarjetas de
 * perfil y cambio de contraseña que antes solo vivían dentro de la
 * Configuración exclusiva del administrador, de modo que un mecánico o un rol
 * personalizado pueda ver su nombre, usuario de acceso y rol, y cambiar su
 * propia contraseña.
 */
export function ProfilePage() {
  return (
    <div data-ocid="profile.page" className="mx-auto w-full max-w-5xl">
      <header className="mb-6 flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Mi cuenta
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Mi perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulta tu nombre, usuario de acceso y rol, y actualiza tu
          contraseña.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <CallerProfileCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}

export default ProfilePage;
