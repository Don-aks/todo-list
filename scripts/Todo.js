import { getElement, getTransitionDurationInMs } from './utilities.js';
import AnimationController from './AnimationController.js';

class Todo {
  selectors = {
    root: '.todo',
    addForm: '.todo__add-form',
    addInput: '.todo__add-input',
    searchForm: '.todo__search',
    searchInput: '.todo__search-input',
    counter: '.todo__total-num',
    deleteAllBtn: '.todo__delete-btn',
    list: '.todo-list',
    emptyListMessage: '.todo__message-about-empty-list',
    emptyListMessageSearch: '.todo__message-about-empty-list--search',

    task: '.task',
    taskLabel: '.task__label',
    taskCheckbox: '.task__checkbox',
    taskDeleteBtn: '.task__delete-btn',
  };

  stateClasses = {
    deleteAllHidden: 'todo__delete-btn--hidden',
    listEmpty: 'todo-list--empty',
    emptyListMessageHidden: 'todo__message-about-empty-list--hidden',

    taskHidden: 'task--hidden',
    taskChangingPosition: 'task--changing-position',
  };

  localStorageKey = 'todoTasks';

  #getElement(selector) {
    return this.rootElement.querySelector(selector);
  }

  #getTask(id) {
    return this.taskListElement.querySelector(
      `${this.selectors.task}[data-id="${id}"]`,
    );
  }

  constructor() {
    this.rootElement = getElement(this.selectors.root);
    this.addFormElement = this.#getElement(this.selectors.addForm);
    this.addInputElement = this.#getElement(this.selectors.addInput);
    this.counterElement = this.#getElement(this.selectors.counter);
    this.searchFormElement = this.#getElement(this.selectors.searchForm);
    this.searchInputElement = this.#getElement(this.selectors.searchInput);
    this.deleteAllBtnElement = this.#getElement(this.selectors.deleteAllBtn);
    this.taskListElement = this.#getElement(this.selectors.list);
    this.emptyListMessageElement = this.#getElement(
      this.selectors.emptyListMessage,
    );
    this.emptyListMessageSearchElement = this.#getElement(
      this.selectors.emptyListMessageSearch,
    );

    this.initialize();
    const btn = this.deleteAllBtnElement;
    const style = getComputedStyle(btn);
    btn.style.transition = style.getPropertyValue('--transition');
  }

  initialize() {
    this.tasks = this.#loadTasksFromLocalStorage();
    this.filteredTasks = null;
    this.searchQuery = '';

    this.animation = new AnimationController(this.stateClasses);

    this.render(true);
    this.bindEventListeners();
  }

  render(isFirstRender = false) {
    this.#renderInfo();
    this.#renderTasks();
    this.#renderNoTasksInfoMessages(isFirstRender);
  }

  addTask(title) {
    this.tasks.push({
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title,
      isChecked: false,
    });
    this.#saveTasksToLocalStorage();

    this.#renderInfo();
    this.#addTaskElement(this.tasks[this.tasks.length - 1]);
    this.#renderNoTasksInfoMessages();
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.#renderInfo();
    this.#saveTasksToLocalStorage();

    const taskElement = this.#getTask(taskId);
    if (!taskElement) return;
    this.animation.deleteTask(taskElement);
    this.#renderNoTasksInfoMessages();
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find((task) => task.id === taskId);
    if (!task) return;

    task.isChecked = !task.isChecked;
    this.#saveTasksToLocalStorage();

    const taskElement = this.#getTask(taskId);
    if (!taskElement) return;

    this.#setTaskElementState(taskElement, task.isChecked);
    this.#renderInfo();
  }

  filterTasks(query) {
    this.searchQuery = query.trim().toLowerCase();

    this.filteredTasks = this.tasks.filter((task) =>
      task.title.toLowerCase().includes(this.searchQuery),
    );
    this.render();
  }

  resetFilter() {
    this.searchQuery = '';
    this.filteredTasks = null;
  }

  bindEventListeners() {
    this.addFormElement.addEventListener('submit', this.#onAddFormSubmit);

    this.searchFormElement.addEventListener(
      'submit',
      this.#onSearchTaskFormSubmit,
    );
    this.searchFormElement.addEventListener(
      'reset',
      this.#onSearchTaskFormClear,
    );
    this.searchInputElement.addEventListener(
      'input',
      this.#onSearchTaskInputChange,
    );

    this.deleteAllBtnElement.addEventListener(
      'click',
      this.#onDeleteAllBtnClick,
    );

    this.taskListElement.addEventListener('click', this.#onTaskListClick);
    this.taskListElement.addEventListener('change', this.#onTaskListChange);
  }

  #loadTasksFromLocalStorage() {
    const rawData = localStorage.getItem(this.localStorageKey);
    if (rawData) {
      try {
        const tasks = JSON.parse(rawData);
        return Array.isArray(tasks) ? tasks : [];
      } catch (error) {
        console.error('Error parsing tasks from localStorage:', error);
      }
    }

    return [];
  }

  #saveTasksToLocalStorage() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.tasks));
  }

  #renderInfo() {
    this.counterElement.textContent = this.tasks.length;

    this.deleteAllBtnElement.classList.toggle(
      this.stateClasses.deleteAllHidden,
      this.tasks.length === 0,
    );
  }

  #renderTasks() {
    const tasks = this.filteredTasks ?? this.tasks;
    this.taskListElement.innerHTML = tasks
      .map(
        ({ id, title, isChecked }) => `
        <li
          class="task todo-list__task border rounded"
          data-id="${id}"
        >
          <input
            class="task__checkbox"
            type="checkbox"
            id="task-${id}"
            ${isChecked ? 'checked' : ''}
          />
          <label class="task__label" for="task-${id}">${title}</label>
          <button class="task__delete-btn" type="button">
            <svg class="task__delete-icon">
              <use href="sprite.svg#close"></use>
            </svg>
          </button>
        </li>
    `,
      )
      .join('');
  }

  #renderNoTasksInfoMessages(isFirstRender) {
    const tasks = this.filteredTasks ?? this.tasks;
    const isEmpty = tasks.length === 0;
    const isSearch = this.searchQuery !== '';

    // Управление отображением списка задач и сообщений
    if (isEmpty) {
      // Список пуст - мгновенно скрываем список и показываем соответствующее сообщение
      this.taskListElement.classList.add(this.stateClasses.listEmpty);
      this.taskListElement.style.display = 'none';

      // Показываем нужное сообщение
      const messageToShow = isSearch
        ? this.emptyListMessageSearchElement
        : this.emptyListMessageElement;
      const messageToHide = isSearch
        ? this.emptyListMessageElement
        : this.emptyListMessageSearchElement;

      // Скрываем ненужное сообщение
      this.animation.hideElement(messageToHide, {
        hiddenClass: this.stateClasses.emptyListMessageHidden,
        withAnimation: !isFirstRender,
      });

      // Показываем нужное сообщение с анимацией
      this.animation.showElement(messageToShow, {
        hiddenClass: this.stateClasses.emptyListMessageHidden,
        withAnimation: !isFirstRender,
      });

      return;
    }

    // Скрываем оба сообщения
    this.animation.hideElement(this.emptyListMessageElement, {
      hiddenClass: this.stateClasses.emptyListMessageHidden,
      withAnimation: !isFirstRender,
    });
    this.animation.hideElement(this.emptyListMessageSearchElement, {
      hiddenClass: this.stateClasses.emptyListMessageHidden,
      withAnimation: !isFirstRender,
    });

    // Показываем список задач
    this.animation.showElement(this.taskListElement, {
      hiddenClass: this.stateClasses.listEmpty,
      withAnimation: !isFirstRender,
    });
  }

  #addTaskElement(task) {
    const { id, title, isChecked } = task;
    if (!title.toLowerCase().includes(this.searchQuery)) return;

    const taskElement = document.createElement('li');
    taskElement.className = `task ${this.stateClasses.taskHidden} todo-list__task border rounded`;
    taskElement.setAttribute('data-id', task.id);

    taskElement.innerHTML = `
      <input
        class="task__checkbox"
        type="checkbox"
        id="task-${id}"
        ${isChecked ? 'checked' : ''}
      />
      <label class="task__label" for="task-${id}">${title}</label>
      <button class="task__delete-btn" type="button">
        <svg class="task__delete-icon">
          <use href="sprite.svg#close"></use>
        </svg>
      </button>
    `;
    this.taskListElement.appendChild(taskElement);
    this.animation.showTask(taskElement);
  }

  async #setTaskElementState(taskElement, isChecked) {
    const tasks = [...this.taskListElement.children];
    const taskIndex = tasks.findIndex((el) => el === taskElement);

    const isLastTask = taskIndex === tasks.length - 1;
    const isFirstTask = taskIndex === 0;
    if ((isChecked && isLastTask) || (!isChecked && isFirstTask)) return;

    await this.animation.animateTaskSwap(this.taskListElement, {
      tasks,
      taskElement,
      taskIndex,
      isChecked,
    });

    this.tasks = this.tasks.filter(
      (task) => task.id !== taskElement.dataset.id,
    );

    const taskData = {
      id: taskElement.getAttribute('data-id'),
      title: taskElement.querySelector(this.selectors.taskLabel).textContent,
      isChecked,
    };

    if (isChecked) {
      this.tasks.push(taskData);
    } else {
      this.tasks.unshift(taskData);
    }

    this.#saveTasksToLocalStorage();
  }

  #onAddFormSubmit = (event) => {
    event.preventDefault();
    const title = this.addInputElement.value.trim();
    if (title === '') return;

    this.addTask(title);
    this.resetFilter();

    this.addInputElement.value = '';
    this.addInputElement.focus();
  };

  #onSearchTaskFormSubmit = (event) => {
    event.preventDefault();
  };

  #onSearchTaskFormClear = (event) => {
    event.preventDefault();

    this.searchInputElement.value = '';
    this.resetFilter();
    this.render();
  };

  #onSearchTaskInputChange = ({ target }) => {
    const query = target.value.trim();
    if (query === '') {
      this.resetFilter();
      this.render();
      return;
    }

    this.filterTasks(query);
  };

  #onDeleteAllBtnClick = async () => {
    const isConfirmed = confirm('Are you sure you want to delete all tasks?');
    if (!isConfirmed) return;

    const tasks = this.taskListElement.querySelectorAll(this.selectors.task);
    if (tasks.length === 0) return;

    const transitionDuration = getTransitionDurationInMs(tasks[0]);
    for (const taskElement of tasks) {
      this.animation.deleteTask(taskElement);
      await new Promise((resolve) => setTimeout(resolve, transitionDuration));
    }

    this.tasks = this.tasks.filter(
      (task) => !task.title.includes(this.searchQuery),
    );
    this.#saveTasksToLocalStorage();
    this.render();
  };

  #onTaskListClick = ({ target }) => {
    const taskElement = target.closest(this.selectors.task);
    if (!taskElement) return;

    const taskId = taskElement.getAttribute('data-id');
    if (target.closest(this.selectors.taskDeleteBtn)) {
      this.deleteTask(taskId);
    }
  };

  #onTaskListChange = (event) => {
    const { target } = event;

    if (target.matches(this.selectors.taskCheckbox)) {
      const taskElement = target.closest(this.selectors.task);
      const taskId = taskElement.getAttribute('data-id');

      event.preventDefault();
      this.toggleTaskCompletion(taskId);
    }
  };
}

export default Todo;
