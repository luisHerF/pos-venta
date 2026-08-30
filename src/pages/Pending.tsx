import { useAuth } from '../context/AuthContext'

export default function Pending() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md text-center">
        <div className="text-4xl mb-3">⏳</div>
        <h1 className="text-xl font-bold mb-2">Cuenta creada, esperando asignación</h1>
        <p className="text-gray-500 text-sm mb-4">
          Hola{profile?.full_name ? `, ${profile.full_name}` : ''}. Tu cuenta ya existe pero todavía no está
          asignada a ninguna tienda. Pide a tu super administrador o a tu administrador de tienda que te
          comparta un código de invitación, y vuelve a registrarte con ese código, o pídeles que actualicen
          tu cuenta directamente.
        </p>
        <button onClick={signOut} className="btn-secondary">Cerrar sesión</button>
      </div>
    </div>
  )
}
