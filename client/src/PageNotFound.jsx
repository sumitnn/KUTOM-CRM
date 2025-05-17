

const PageNotFound = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-16 sm:px-6 lg:px-8">
    <div className="text-center">
      <p className="text-4xl font-bold text-indigo-600">404</p>
      <h1 className="mt-4 text-3xl font-extrabold text-gray-900 sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 text-base text-gray-600 sm:text-lg">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4">
        <a
          href="/"
          className="inline-block rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Go back home
                  </a>
                  <a
          href="/"
          className="inline-block rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Go back home
        </a>
        
      </div>
    </div>
  </main>
  
  )
}

export default PageNotFound