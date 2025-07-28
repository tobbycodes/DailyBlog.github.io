const postsContainer = document.getElementById('posts-container');
const apiUrl = 'https://api.jsonbin.io/v3/b/688679367b4b8670d8a83682';
const apiKey = '$2a$10$/ZBTIt8IlZkNCbZ8A0eakelsndZyv.pl9Du9xkKicTkLlQohc0T7W';


let currentUser = null;

document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();

  // Hardcoded users: you can load them from JSONBin too!
  const users = [
    { id: '1', username: 'admin', role: 'admin' },
    { id: '2', username: 'user1', role: 'user' },
    { id: '3', username: 'user2', role: 'user' }
  ];

  const foundUser = users.find(u => u.username === username);
  if (foundUser) {
    currentUser = foundUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert(`Logged in as ${username}`);
    fetchAndDisplayPosts();
  } else {
    alert('User not found');
  }
});

// Restore user from localStorage
const savedUser = localStorage.getItem('currentUser');
if (savedUser) {
  currentUser = JSON.parse(savedUser);
}
    //Fetch and Display Posts

function fetchAndDisplayPosts() {
    fetch(`${apiUrl}/latest`, {
    headers: { 'X-Master-Key': apiKey }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.record.record.record.posts)
    postsContainer.innerHTML = '';
    if (data.record && data.record.record.record && Array.isArray(data.record.record.record.posts)) {
        data.record.record.record.posts.forEach(post => {
        displayPost(post);
        });
    } else {
        console.error('Invalid data structure:', JSON.stringify(data, null, 2));
    }
    })
    .catch(error => {
    console.error('Error fetching posts:', error);
    });
}


//Display a Post made by the user
function displayPost(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.setAttribute('data-id', post.id);
    postElement.innerHTML = ` 
    ${post.image ? `<img src="${post.image}" alt="Post Image" style="max-width: 100%;"/>`: ''}
    <h2>${post.title}</h2>
    <p>${post.content}</p>
    ${(currentUser &&
    (currentUser.role === 'admin' || currentUser.id === post.authorId)) ? `
    <button class="delete-button">Delete</button>
    ` : ''}
    `;
    postsContainer.appendChild(postElement);

    postElement.querySelector('.delete-button').addEventListener('click', function() {
    deletePost(post.id);
    });
}


//Delete a Post made by the user
function deletePost(postId) {
    fetch(`${apiUrl}/latest`, {
    headers: {
        'X-Master-Key': apiKey
    }
    })
    .then(response => response.json())
    .then(data => {
    const updatedPosts = data.record.record.posts.filter(post => post.id !== postId);

    return fetch(apiUrl, {
        method: 'PUT',
        headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
        },
        body: JSON.stringify({ record: { posts: updatedPosts } })
    });
    })
    .then(response => {
    if (!response.ok) {
        throw new Error('Failed to delete post');
    }
    return response.json();
    })
    .then(() => {
    fetchAndDisplayPosts();
    })
    .catch(error => {
    console.error('Error deleting post:', error);
    });
}


//Reduce the image sixe
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const ratio = img.width / img.height;
            canvas.width = maxWidth;
            canvas.height = maxWidth / ratio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

document.getElementById('post-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const title = formData.get('title');
    const content = formData.get('content');
    const imageFile = document.getElementById('imageUpload').files[0];

    if (imageFile) {
    compressImage(imageFile)
        .then(compressedImage => {
        createPost(title, content, compressedImage);
        })
        .catch(error => {
        console.error('Image compression failed:', error);
        createPost(title, content); // Proceed without image if compression fails
        });
    } else {
    createPost(title, content);
    }
});

function createPost(title, content, imageUrl = null) {
    fetch(`${apiUrl}/latest`, {
    headers: {
        'X-Master-Key': apiKey
    }
    })
    .then(response => response.json())
    .then(data => {
        console.log("Fetched Data:",data)
    const newPost = {
        id: Date.now().toString(),
        title: title,
        content: content,
        image: imageUrl,
        authorId: currentUser?.id || '',
        authorName: currentUser?.username || '',
    };
    data.record.record.record.posts.push(newPost);

    return fetch(apiUrl, {
        method: 'PUT',
        headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
        },
        body: JSON.stringify({ record: data.record.record })
    });
    })
    .then(response => {
    if (!response.ok) {
        throw new Error('Failed to add post');
    }
    return response.json();
    })
    .then(() => {
    fetchAndDisplayPosts();
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    })
    .catch(error => {
    console.error('Error adding post:', error);
    });
}

fetchAndDisplayPosts();
