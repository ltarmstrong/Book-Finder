document.addEventListener('DOMContentLoaded', () => {
  // Get references to the form and dropdown menus
  const form = document.querySelector('#recommendation-form');
  const genreSelect = document.querySelector('#genre-select');
  const levelSelect = document.querySelector('#level-select');
  const categorySelect = document.querySelector('#category-select');

  // Add an event listener for the form submit event
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from submitting normally

    const genre = genreSelect.value;
    const level = levelSelect.value;
    const category = categorySelect.value ? categorySelect.value.split(';').map((c) => encodeURIComponent(c.trim())).join(';') : '';

    const response = await fetch(`http://localhost:3000/books?book_type=${encodeURIComponent(genre)}&reading_level=${encodeURIComponent(level)}&categories=${category}`);

    if (response.ok) {
      const data = await response.json();
      displayRecommendations(data);
    } else {
      console.error(`Error retrieving recommendations: ${response.status} ${response.statusText}`);
      // Handle the error as needed
    }
  });

  // Helper function to display the recommended books
  function displayRecommendations(data) {
    const container = document.querySelector('#recommendations-container');
    container.innerHTML = '';

    for (const category in data) {
      const books = data[category];

      const categoryTitle = document.createElement('h2');
      categoryTitle.textContent = category;
      container.appendChild(categoryTitle);

      const bookList = document.createElement('ul');
      bookList.classList.add('book-list');

      books.forEach((book) => {
        const card = document.createElement('div');
        card.classList.add('card');

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const image = document.createElement('img');
        image.src = book.cover_art_url;
        image.alt = book.title;
        imageContainer.appendChild(image);

        const title = document.createElement('h3');
        title.textContent = book.title;

        const author = document.createElement('p');
        author.textContent = `By ${book.authors.join(', ')}`;

        card.append(imageContainer, title, author);
        bookList.appendChild(card);
      });

      container.appendChild(bookList);
    }
  }

  // Helper function to capitalize the first letter of a string
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Populate the genre, reading level, and category dropdowns
  // Populate the genre, reading level, and category dropdowns
  function populateDropdowns() {
    const genres = ['fiction', 'nonfiction', ''];
    const levels = ['beginner', 'intermediate', 'advanced'];
    const categories = ['Animals, Bugs & Pets', 'Art, Creativity & Music', 'General Literature', 'Hobbies, Sports & Outdoors', 'Science Fiction & Fantasy', 'Real Life', 'Science & Technology', 'Mystery & Suspense', 'Reference'];

    const genreOptions = genres.map((genre) => `<option value="${genre}">${capitalizeFirstLetter(genre)}</option>`);
    const levelOptions = levels.map((level) => `<option value="${level}">${capitalizeFirstLetter(level)}</option>`);
    const categoryOptions = categories.map((category) => `<option value="${category.replace(/&/g, '%26').replace(/;/g, '%3B')}">${category}</option>`);

    genreSelect.innerHTML = genreOptions.join('');
    levelSelect.innerHTML = levelOptions.join('');
    categorySelect.innerHTML = categoryOptions.join('');
  }

  // Call the function to populate the dropdowns on DOMContentLoaded event
  populateDropdowns();

});
