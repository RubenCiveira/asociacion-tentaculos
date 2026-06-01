interface Props {
  title: string
  description?: string
}

export default function PlaceholderPage({ title, description }: Props) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
      <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 h-64 flex items-center justify-center text-gray-400 text-sm">
        Módulo en construcción
      </div>
    </div>
  )
}
