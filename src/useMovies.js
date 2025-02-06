import { useState, useEffect } from "react";

const KEY = 'b0987b1b'

export function useMovies(query, handleCloseMovie) {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(function () {
        const controller = new AbortController();

        setIsLoading(true)

        async function fetchMovies() {
            try {
                setError('')

                if (query.length < 3) {
                    setMovies([])
                    setError('')
                    return
                }
                // handleCloseMovie()

                const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`, { signal: controller.signal })

                if (!res.ok) throw new Error('Something went wrong with fatching movies')

                const data = await res.json()
                if (data.Response === "False") throw new Error('Movie not found')

                setMovies(data.Search)
                setError('')
            }
            catch (err) {
                if (err.message !== 'AbortError') {
                    console.log(err.message)
                    setError(err.message)
                }
            }
            finally {
                setIsLoading(false)
            }
        }

        fetchMovies()

        return function () {
            controller.abort()
        }
    }, [query])
    return {
        movies,
        isLoading,
        error,
    }
}
