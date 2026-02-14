document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://YOUR_LAPTOP_IP:8000'; // IMPORTANT: CHANGE 'YOUR_LAPTOP_IP' TO YOUR ACTUAL IP ADDRESS (e.g., 192.168.1.100)
    const page = window.location.pathname.split("/").pop();
    
    // --- AUTHENTICATION & DATA MGMT ---
    const getUsers = () => JSON.parse(localStorage.getItem('mealFlowUsers') || '[]');
    const saveUsers = (users) => localStorage.setItem('mealFlowUsers', JSON.stringify(users));
    const getCurrentUserEmail = () => localStorage.getItem('mealFlowCurrentUser');
    const setCurrentUserEmail = (email) => localStorage.setItem('mealFlowCurrentUser', email);
    const logoutUser = () => localStorage.removeItem('mealFlowCurrentUser');

    const getCurrentUser = () => {
        const users = getUsers();
        const email = getCurrentUserEmail();
        return users.find(u => u.email === email);
    };

    const saveCurrentUser = (user) => {
        if (!user) return;
        const users = getUsers();
        const index = users.findIndex(u => u.email === user.email);
        if (index > -1) {
            users[index] = user;
            saveUsers(users);
        }
    };
    
    // --- INGREDIENT DATA (Unchanged) ---
    const ingredientsData = {
        'Vegetables': ['Onion', 'Tomato', 'Potato', 'Carrot', 'Spinach', 'Cauliflower', 'Cabbage', 'Bell Pepper (Capsicum)', 'Eggplant (Brinjal)', 'Okra (Bhindi)', 'Green Peas', 'Ginger', 'Garlic', 'Green Chili'],
        'Leafy Greens': ['Coriander Leaves', 'Mint Leaves', 'Fenugreek Leaves (Methi)', 'Curry Leaves'],
        'Lentils & Pulses (Dal)': ['Red Lentils (Masoor)', 'Yellow Pigeon Peas (Toor/Arhar)', 'Split Chickpeas (Chana Dal)', 'Green Gram (Moong)', 'Kidney Beans (Rajma)', 'Chickpeas (Chole)'],
        'Grains': ['Basmati Rice', 'Whole Wheat Flour (Atta)', 'Semolina (Sooji/Rava)'],
        'Dairy & Paneer': ['Yogurt (Dahi)', 'Paneer', 'Milk', 'Ghee', 'Butter'],
        'Spices': ['Turmeric Powder', 'Red Chili Powder', 'Coriander Powder', 'Cumin Seeds', 'Mustard Seeds', 'Garam Masala', 'Asafoetida (Hing)', 'Cardamom', 'Cloves', 'Cinnamon'],
        'Non-Vegetarian': ['Chicken', 'Mutton (Goat)', 'Fish', 'Eggs'],
        'Oils': ['Vegetable Oil', 'Mustard Oil']
    };

    // --- ROUTING & PAGE INIT ---
    const protectedPages = ['dashboard.html', 'family.html', 'recipe.html'];
    if (protectedPages.includes(page) && !getCurrentUserEmail()) {
        window.location.href = 'index.html';
        return; // Stop further execution
    }

    // --- NAVBAR INJECTION & UI ---
    // Only load navbar if on a protected page (not index.html)
    if (page !== 'index.html' && page !== '') {
        loadNavbar();
    }

    async function loadNavbar() {
        const navbarPlaceholder = document.getElementById('navbar-placeholder');
        // Only load the navbar on pages that have the placeholder
        if (navbarPlaceholder) {
            try {
                const response = await fetch('_navbar.html');
                const navbarHTML = await response.text();
                navbarPlaceholder.innerHTML = navbarHTML;
                setupNavbar();
            } catch (error) {
                console.error('Error loading navbar:', error);
            }
        }
    }

    function setupNavbar() {
        const user = getCurrentUser();
        const page = window.location.pathname.split("/").pop();

        // --- Elements ---
        const userNameSpan = document.getElementById('user-name');
        const mobileUserNameSpan = document.getElementById('mobile-user-name');
        const logoutBtn = document.getElementById('logout-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuIcon = document.getElementById('mobile-menu-icon'); // This is now a FontAwesome icon
        const navLinks = document.querySelectorAll('.nav-link');

        // --- User Info ---
        if (user) {
            if (userNameSpan) userNameSpan.textContent = `Hi, ${user.name}!`;
            if (mobileUserNameSpan) mobileUserNameSpan.textContent = user.name;

            const handleLogout = () => {
                logoutUser();
                window.location.href = 'index.html';
            };
            if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
            if(mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);

        }

        // --- Mobile Menu Toggle ---
        if (mobileMenuBtn && mobileMenu && mobileMenuIcon) {
            mobileMenuBtn.addEventListener('click', () => {
                const isHidden = mobileMenu.classList.toggle('hidden');
                mobileMenuIcon.classList.toggle('fa-bars');
                mobileMenuIcon.classList.toggle('fa-xmark');
            });
        }
        
        // --- Active Link Highlighting ---
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('text-[#FF9800]', 'border-b-2', 'border-[#FF9800]');
                link.classList.remove('text-gray-600');
            }
        });
        
        // FontAwesome is linked in the HTML directly, no JS rendering needed here
    }

    // ===================================
    // 1. HOME / LOGIN PAGE (index.html)
    // ===================================
    function initHomePage() {
        // If a user is already logged in, redirect them to the family page.
        if (getCurrentUserEmail()) {
            window.location.href = 'family.html';
            return;
        }

        const authModal = document.getElementById('auth-modal');
        const showLoginBtn = document.getElementById('show-login-btn');
        const showSignupBtn = document.getElementById('show-signup-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const loginSection = document.getElementById('login-section');
        const signupSection = document.getElementById('signup-section');
        const switchToSignupBtn = document.getElementById('switch-to-signup');
        const switchToLoginBtn = document.getElementById('switch-to-login');

        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        // Show login modal
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                authModal.classList.remove('hidden');
                loginSection.classList.remove('hidden');
                signupSection.classList.add('hidden');
            });
        }

        // Show signup modal
        if (showSignupBtn) {
            showSignupBtn.addEventListener('click', () => {
                authModal.classList.remove('hidden');
                signupSection.classList.remove('hidden');
                loginSection.classList.add('hidden');
            });
        }

        // Close modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                authModal.classList.add('hidden');
            });
        }

        // Switch to signup from login
        if (switchToSignupBtn) {
            switchToSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                loginSection.classList.add('hidden');
                signupSection.classList.remove('hidden');
            });
        }

        // Switch to login from signup
        if (switchToLoginBtn) {
            switchToLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                signupSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
            });
        }

        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const users = getUsers();
                const email = document.getElementById('modal-login-email').value;
                const user = users.find(u => u.email === email);

                if (user) {
                    setCurrentUserEmail(email);
                    window.location.href = 'family.html';
                } else {
                    alert('No account found with this email. Please sign up.');
                }
            });
        }

        // Signup form submission
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const users = getUsers();
                const name = document.getElementById('modal-signup-name').value;
                const email = document.getElementById('modal-signup-email').value;

                if (users.some(u => u.email === email)) {
                    alert('An account with this email already exists. Please log in.');
                    return;
                }

                const newUser = {
                    name: name,
                    email: email,
                    family: [],
                    pantry: {
                        ingredients: [],
                        mealType: 'Dinner'
                    }
                };

                users.push(newUser);
                saveUsers(users);
                setCurrentUserEmail(email);
                window.location.href = 'family.html';
            });
        }
    }


    // ===================================
    // 2. FAMILY PAGE (family.html)
    // ===================================
    function initFamilyPage() {
        const form = document.getElementById('family-form');
        const listContainer = document.getElementById('family-list-container');
        const memberIdInput = document.getElementById('member-id');
        const submitBtn = document.getElementById('submit-btn');
        const formTitle = document.getElementById('form-title');
        const dashboardLink = document.getElementById('dashboard-link');

        const calculateAge = (birthday) => {
            if (!birthday) return 'N/A';
            const birthDate = new Date(birthday);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

        const renderFamilyList = () => {
            const user = getCurrentUser();
            if (!user) return;

            listContainer.innerHTML = ''; // Clear previous list
            if (user.family.length === 0) {
                listContainer.innerHTML = `
                    <div class="text-center bg-white p-8 rounded-2xl shadow">
                        <h3 class="text-xl font-semibold">No family members yet!</h3>
                        <p class="text-gray-500 mt-2">Use the form on the left to add your first family member.</p>
                    </div>`;
                dashboardLink.classList.add('hidden'); // Hide button if no members
                return;
            }

            dashboardLink.classList.remove('hidden'); // Show button if members exist

            user.family.forEach(member => {
                const age = calculateAge(member.birthday);
                const card = document.createElement('div');
                card.className = 'bg-white p-5 rounded-2xl shadow-lg flex justify-between items-start transition-transform hover:scale-105';
                card.innerHTML = `
                    <div class="space-y-2">
                        <h4 class="font-bold text-xl text-[#1C1C1C]">${member.name} <span class="text-gray-500 font-medium">(${age} yrs)</span></h4>
                        <p class="text-sm"><span class="font-semibold text-gray-600">Diet:</span> ${member.dietary_preference}</p>
                        <p class="text-sm"><span class="font-semibold text-gray-600">Goals:</span> ${member.health_goals || 'None'}</p>
                        <p class="text-sm"><span class="font-semibold text-gray-600">Dislikes/Allergies:</span> ${member.dislikes || 'None'}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button data-id="${member.id}" class="edit-btn p-2 rounded-full hover:bg-blue-100 transition-colors" title="Edit ${member.name}">
                            <i class="h-5 w-5 text-[#5BB0D9] fas fa-pencil-alt"></i>
                        </button>
                        <button data-id="${member.id}" class="delete-btn p-2 rounded-full hover:bg-red-100 transition-colors" title="Delete ${member.name}">
                            <i class="h-5 w-5 text-red-500 fas fa-trash"></i>
                        </button>
                    </div>
                `;
                listContainer.appendChild(card);
            });
            // Re-render heroicons after updating the list
            // FontAwesome is now used directly in HTML, no need for heroicons rendering here
        };
        
        const resetForm = () => {
            form.reset();
            memberIdInput.value = '';
            formTitle.textContent = 'Add a New Member';
            submitBtn.textContent = 'Add Member';
            submitBtn.classList.replace('bg-[#5BB0D9]', 'bg-[#FF9800]');
            submitBtn.classList.replace('hover:bg-[#7EC8E3]', 'hover:bg-[#FB8C00]');

        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = getCurrentUser();
            const memberData = {
                id: memberIdInput.value || Date.now().toString(),
                name: document.getElementById('name').value,
                birthday: document.getElementById('birthday').value, // Store birthday string
                dietary_preference: document.getElementById('diet').value,
                health_goals: document.getElementById('health_goals').value,
                dislikes: document.getElementById('dislikes').value
            };

            if (memberIdInput.value) { // Editing
                const index = user.family.findIndex(m => m.id === memberIdInput.value);
                if (index > -1) user.family[index] = memberData;
            } else { // Adding
                user.family.push(memberData);
            }

            saveCurrentUser(user);
            renderFamilyList();
            resetForm();
        });
        
        document.getElementById('clear-btn').addEventListener('click', resetForm);

        listContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            
            const id = btn.dataset.id;
            const user = getCurrentUser();

            if (btn.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this family member?')) {
                    user.family = user.family.filter(m => m.id !== id);
                    saveCurrentUser(user);
                    renderFamilyList();
                }
            } else if (btn.classList.contains('edit-btn')) {
                const member = user.family.find(m => m.id === id);
                if (member) {
                    memberIdInput.value = member.id;
                    document.getElementById('name').value = member.name;
                    document.getElementById('birthday').value = member.birthday;
                    document.getElementById('diet').value = member.dietary_preference;
                    document.getElementById('health_goals').value = member.health_goals;
                    document.getElementById('dislikes').value = member.dislikes;
                    
                    formTitle.textContent = `Editing ${member.name}`;
                    submitBtn.textContent = 'Update Member';
                    submitBtn.classList.replace('bg-[#FF9800]', 'bg-[#5BB0D9]');
                    submitBtn.classList.replace('hover:bg-[#FB8C00]', 'hover:bg-[#7EC8E3]');

                    form.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
        
        renderFamilyList();
    }

    // ===================================
    // 3. DASHBOARD PAGE (dashboard.html)
    // ===================================
    function initDashboardPage() {
        const user = getCurrentUser();
        if(!user.pantry) user.pantry = { ingredients: [], mealType: 'Dinner' };

        const listContainer = document.getElementById('ingredient-list-container');
        const previewContainer = document.getElementById('selected-ingredients-preview');
        const searchInput = document.getElementById('ingredient-search');
        const mealTypeSelector = document.getElementById('meal-type-selector');

        const renderIngredients = (filter = '') => {
            listContainer.innerHTML = '';
            const filterLower = filter.toLowerCase();

            Object.keys(ingredientsData).forEach(category => {
                const filtered = ingredientsData[category].filter(ing => ing.toLowerCase().includes(filterLower));
                if (filtered.length > 0) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.innerHTML = `<h3 class="text-xl font-bold mb-3 text-gray-700">${category}</h3>`;
                    const grid = document.createElement('div');
                    grid.className = 'grid grid-cols-2 sm:grid-cols-3 gap-2';
                    filtered.forEach(ingredient => {
                        const isChecked = user.pantry.ingredients.includes(ingredient);
                        grid.innerHTML += `
                            <label class="ingredient-checkbox-label flex items-center space-x-3 p-2 rounded-lg">
                                <input type="checkbox" value="${ingredient}" ${isChecked ? 'checked' : ''} class="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500">
                                <span>${ingredient}</span>
                                <i class="checkmark w-5 h-5 text-green-500 ml-auto fas fa-check-circle opacity-0 transition-opacity"></i>
                            </label>
                        `;
                    });
                    categoryDiv.appendChild(grid);
                    listContainer.appendChild(categoryDiv);
                }
            });
        };

        const renderPreview = () => {
            previewContainer.innerHTML = '';
            if (user.pantry.ingredients.length === 0) {
                previewContainer.innerHTML = '<p class="text-gray-400">Select ingredients to see them here.</p>';
                return;
            }
            const list = document.createElement('div');
            list.className = 'flex flex-wrap gap-2';
            user.pantry.ingredients.forEach(ing => {
                list.innerHTML += `<span class="bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1 rounded-full">${ing}</span>`;
            });
            previewContainer.appendChild(list);
        };
        
        const updateMealTypeSelection = () => {
            document.querySelectorAll('.meal-type-label').forEach(label => {
                const input = label.querySelector('input');
                if (input.value === user.pantry.mealType) {
                    label.classList.add('selected');
                    input.checked = true;
                } else {
                    label.classList.remove('selected');
                }
            });
        };

        searchInput.addEventListener('input', () => renderIngredients(searchInput.value));

        listContainer.addEventListener('change', (e) => {
            const ingredient = e.target.value;
            const isChecked = e.target.checked;
            const currentIngredients = new Set(user.pantry.ingredients);
            if(isChecked) currentIngredients.add(ingredient);
            else currentIngredients.delete(ingredient);
            user.pantry.ingredients = Array.from(currentIngredients);
            saveCurrentUser(user);
            renderPreview();
        });

        mealTypeSelector.addEventListener('change', (e) => {
            user.pantry.mealType = e.target.value;
            saveCurrentUser(user);
            updateMealTypeSelection();
        });
        
        renderIngredients();
        renderPreview();
        updateMealTypeSelection();
    }


    // ===================================
    // 4. RECIPE PAGE (recipe.html)
    // ===================================
    function initRecipePage() {
        const recipeContainer = document.getElementById('recipe-container');
        const loadingDiv = document.getElementById('loading-state');
        const errorDiv = document.getElementById('error-state');

        const fetchAndRenderRecipe = async () => {
            const user = getCurrentUser();
            if (!user) { window.location.href = 'index.html'; return; }

            loadingDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');

            try {
                const response = await fetch(`${API_BASE_URL}/generate_meal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        family_members: user.family,
                        ingredients: user.pantry.ingredients,
                        mealType: user.pantry.mealType,
                        dayOfWeek: new Date().toLocaleString('en-us', { weekday: 'long' })
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.detail || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                renderRecipe(data);

            } catch (error) {
                loadingDiv.classList.add('hidden');
                document.getElementById('error-message').textContent = error.message;
                recipeContainer.innerHTML = '';
                recipeContainer.appendChild(errorDiv);
                errorDiv.classList.remove('hidden');
                document.getElementById('regenerate-btn-error').addEventListener('click', fetchAndRenderRecipe);
            }
        };

        const renderRecipe = (data) => {
            recipeContainer.innerHTML = ''; // Clear everything

            const recipeHTML = `
                <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in">
                    <div class="p-8 md:p-12">
                        <div class="text-center mb-8">
                            <p class="text-orange-500 font-semibold">${data.meal.type.toUpperCase()} ${data.pantry.mealType.toUpperCase()}</p>
                            <h2 class="text-4xl md:text-5xl font-extrabold mt-2">${data.meal.name}</h2>
                            <p class="text-gray-600 mt-4 max-w-2xl mx-auto">${data.meal.why_this_meal}</p>
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center my-8">
                            <div><p class="text-3xl font-bold">${data.recipe.total_time_minutes}m</p><p class="text-gray-500">Total Time</p></div>
                            <div><p class="text-3xl font-bold">${data.ingredients_used.length}</p><p class="text-gray-500">Ingredients</p></div>
                            <div><p class="text-3xl font-bold">${data.recipe.steps.length}</p><p class="text-gray-500">Steps</p></div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-8 md:p-12">
                        <div class="max-w-4xl mx-auto">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div class="space-y-8">
                                    <div>
                                        <h3 class="text-2xl font-bold mb-4">Ingredients Used</h3>
                                        <ul class="space-y-2">${data.ingredients_used.map(ing => `<li class="flex items-center"><i class="w-5 h-5 text-green-500 mr-2 fas fa-check-circle"></i><strong>${ing.ingredient}</strong></li>`).join('')}</ul>
                                    </div>
                                    ${data.serving_notes ? `<div><h3 class="text-2xl font-bold mb-4">Serving Notes</h3><p>${data.serving_notes}</p></div>` : ''}
                                </div>
                                <div class="space-y-8">
                                    <div class="collapsible-section">
                                        <button class="section-header flex justify-between items-center w-full">
                                            <h3 class="text-2xl font-bold">Instructions</h3>
                                            <i class="w-6 h-6 transform transition-transform fas fa-chevron-up"></i>
                                        </button>
                                        <div class="section-content mt-4 space-y-4">
                                            ${data.recipe.steps.map((step, i) => `<div class="flex"><div class="font-bold text-orange-500 mr-4">${i+1}.</div><p>${step}</p></div>`).join('')}
                                        </div>
                                    </div>
                                     ${data.tips && data.tips.length > 0 ? `<div><h3 class="text-2xl font-bold mb-4">Chef's Tips</h3><ul class="list-disc list-inside space-y-2">${data.tips.map(tip => `<li>${tip}</li>`).join('')}</ul></div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                     <div class="p-8 text-center">
                        <button id="regenerate-btn" class="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600">Regenerate Meal</button>
                    </div>
                </div>
            `;
            recipeContainer.innerHTML = recipeHTML;

            // Event Listeners
            document.querySelector('.section-header').addEventListener('click', e => {
                const header = e.currentTarget;
                header.nextElementSibling.classList.toggle('hidden');
                header.querySelector('i.fa-chevron-up').classList.toggle('rotate-180');
            });
            document.getElementById('regenerate-btn').addEventListener('click', fetchAndRenderRecipe);
        };
        
        fetchAndRenderRecipe(); // Auto-run on page load
    }
});