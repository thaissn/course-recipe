// Global app controller

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';


/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/**
* SEARCH CONTROLLER
*/

const controlSearch = async () => {
    // 1. Get query from view
    const query = searchView.getInput();
 
    if (query) {
        // 2. New search object and add to state
        state.search = new Search(query);

        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResList();
        renderLoader(elements.searchRes);

        try {
            // 4. Search for recipes
            await state.search.getResults();

            // 5. Render results on UI
            clearLoader();
            searchView.renderRecipes(state.search.results);
        }
        catch (error) {
            alert(`Error processing search results: ${error}`);
            clearLoader();
        }       
    }
};

/**
 * RECIPE CONTROLLER
*/

const controlRecipe = async () => {
    // Get recipe ID from URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        
        // Highlight selected search item
        if (state.search) {
            searchView.highlightSelected(id);
        };

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
             // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id));
        }
        catch (error) {
            alert(`Error processing recipe: ${error}`);
        
        }
    }
};

/**
* LIST CONTROLLER
*/

const controlList = () => {
    // Create a new list IF there isn't one yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

/**
* LIKES CONTROLLER
*/

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        )
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);
    }
    // User HAS liked current recipe
    else {
        // Remove like from state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

/**
* Setup Event Handlers
*/

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResList();
        searchView.renderRecipes(state.search.results, goToPage);
    }
    
});

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
// To replace the two line above and have one event handler for different events use the following:
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// Handle delete and update item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);
    }
    // Handle the count update
    else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        if (val > 1) {
            state.list.updateCount(id, val);
        }
    }
});

// Resrtore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes()
    
    // restore likes
    state.likes.readStorage();
    
    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decreased button is clicked
        if (state.recipe.servings > 1) {
           state.recipe.updateServings('dec');
           recipeView.updateServingsIngredients(state.recipe);
        }        
    }
    else if (e.target.matches('.btn-increase, .btn-increase *')) {
       // Increased button is clicked
       state.recipe.updateServings('inc');
       recipeView.updateServingsIngredients(state.recipe);
    }
    else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
       // Add ingredients to shopping list button is clicked
        controlList();
    }
    else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controler
        controlLike();
    }
});

