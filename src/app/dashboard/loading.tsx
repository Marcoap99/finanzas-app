export default function Loading() {
  return (
    <div className="px-4 pt-5 pb-24 animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded-xl mb-1" />
      <div className="h-4 w-28 bg-gray-100 rounded-xl mb-4" />
      <div className="h-36 bg-gray-200 rounded-3xl mb-3" />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
      </div>
      <div className="h-24 bg-gray-200 rounded-2xl mb-3" />
      <div className="h-32 bg-gray-200 rounded-2xl" />
    </div>
  )
}
