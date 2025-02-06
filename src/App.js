import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalStorage";
import { useKey } from "./useKey";

const KEY = 'b0987b1b'

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);


export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null)
  const [isWatched, setIsWatched] = useState(false)
  const { movies, isLoading, error } = useMovies(query, handleCloseMovie)

  const [watched, setWatched] = useLocalStorageState([], 'watched')

  function handleSelectMovie(id) {
    selectedId !== id ? setSelectedId(id) : setSelectedId(null)
  }

  function handleCloseMovie() {
    setSelectedId(null)
  }

  function handleAddWatched(movie) {
    if (watched.length === 0 || watched.some(el => el.imdbID !== movie.imdbID)) {
      setWatched(watched => [...watched, movie])
    }

  }

  function handleDeleteWatchedMovie(id) {
    setWatched(watched => watched.filter(movie => movie.imdbID !== id))
  }

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main >
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && <MovieList movies={movies} onSelectMovie={handleSelectMovie} />}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? <MovieDetails selectedId={selectedId} onCloseMovie={handleCloseMovie}
            onAddMovieWatched={handleAddWatched} watched={watched}
          /> :
            <>
              <WatchSummary watched={watched} />
              <WatchedMoviesList watched={watched} onDeleteWatched={handleDeleteWatchedMovie} />
            </>
          }
        </Box>
      </Main>

    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔</span>
      {message}
    </p>
  )
}

function NavBar({ children }) {

  return (
    <nav className="nav-bar">
      {children}
    </nav>
  )
}

function NumResults({ movies }) {
  return (<p className="num-results">
    Found <strong>{movies.length}</strong> results
  </p>)
}

function Logo() {
  return (<div className="logo">
    <span role="img">🍿</span>
    <h1>usePopcorn</h1>
  </div>)
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null)

  useKey('enter', function () {
    if (document.activeElement === inputEl.current) return
    inputEl.current.focus()
    setQuery('')
  })

  return (<input
    className="search"
    type="text"
    placeholder="Search movies..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    ref={inputEl}
  />)
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);


  return (<div className="box">
    <button
      className="btn-toggle"
      onClick={() => setIsOpen((open) => !open)}
    >
      {isOpen ? "–" : "+"}
    </button>
    {isOpen &&

      children
    }
  </div>)
}

function MovieList({ movies, onSelectMovie }) {


  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie onSelectMovie={onSelectMovie} movie={movie} key={movie.imdbID} />))}
    </ul>
  )

}

function MovieDetails({ selectedId, onCloseMovie, onAddMovieWatched, watched }) {
  const [movie, setMovie] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [userRating, setUserRating] = useState('')

  const countRef = useRef(0);


  useEffect(function () {
    async function getMovieDetails() {
      setIsLoading(true)
      const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`)
      const data = await res.json()
      setMovie(data)

      setIsLoading(false)
    }
    getMovieDetails()
  }, [selectedId])

  useEffect(function () {
    if (userRating) {
      countRef.current++;
    }
  }, [userRating])

  const isWatched = watched.map(movie => movie.imdbID).includes(selectedId)
  const watchedUserRating = watched.find(movie => movie.imdbID === selectedId)?.userRating

  const { Title: title, Year: year, Poster: poster, Runtime: runtime, imdbRating, Plot: plot, Released: released, Actors: actors, Director: director, Genre: genre } = movie

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(' ').at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    }

    onAddMovieWatched(newWatchedMovie)
    onCloseMovie()
  }

  useKey('Escape', onCloseMovie)

  useEffect(function () {
    async function getMovieDetails() {
      setIsLoading(true)
      const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`)
      const data = await res.json()
      setMovie(data)

      setIsLoading(false)
    }
    getMovieDetails()
  }, [selectedId])

  useEffect(function () {
    if (!title) return
    document.title = `Movie | ${title}`
    return function () {
      document.title = 'usePopcorn'
    }
  }, [title])

  return (
    <div className="details">
      {isLoading ? <Loader /> :
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>&larr;</button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>{released} &bull; {runtime}</p>
              <p>{genre}</p>
              <p><span>⭐</span>{imdbRating} IMDb rating</p>
            </div>
          </header>
          <section>
            <div className="rating">
              {
                !isWatched ? (
                  <>
                    <StarRating maxRating={10} size={24} onSetRating={setUserRating} />

                    {userRating > 0 && <button className="btn-add" onClick={handleAdd}>+ Add to list</button>}
                  </>) :
                  <p>You rated with movie {watchedUserRating} <span>⭐</span></p>
              }
            </div>
            <p><em>{plot}</em></p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      }
    </div>
  )
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  )
}

function WatchSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating)).toFixed(2);
  const avgUserRating = average(watched.map((movie) => movie.userRating)).toFixed(2);
  const avgRuntime = average(watched.map((movie) => movie.runtime)).toFixed(0);

  return (<div className="summary">
    <h2>Movies you watched</h2>
    <div>
      <p>
        <span>#️⃣</span>
        <span>{watched.length} movies</span>
      </p>
      <p>
        <span>⭐️</span>
        <span>{avgImdbRating}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{avgUserRating}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{avgRuntime} min</span>
      </p>
    </div>
  </div>
  )
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (watched.map((movie) => (
    <ul className="list">
      <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched} />
    </ul>)))
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (<li >
    <img src={movie.poster} alt={`${movie.title} poster`} />
    <h3>{movie.title}</h3>
    <div>
      <p>
        <span>⭐️</span>
        <span>{movie.imdbRating.toFixed(2)}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{movie.userRating.toFixed(2)}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{movie.runtime} min</span>
      </p>
      <button className="btn-delete" onClick={() => { onDeleteWatched(movie.imdbID) }}>X</button>
    </div>
  </li>)
}

function Main({ children }) {

  return (<main className="main">
    {children}

  </main>)
}
