import { getTransitionDurationInMs, wait } from './utilities.js';

class AnimationController {
  // disabled by default because first render is not animated
  showHideWithAnimation = false;

  constructor(stateClasses) {
    this.stateClasses = stateClasses;
  }

  showElement(element, { hiddenClass, withAnimation = true }) {
    element.style.display = 'block';

    if (this.showHideWithAnimation) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.classList.remove(hiddenClass);
        });
      });

      return;
    }

    element.classList.remove(hiddenClass);
  }

  hideElement(element, { hiddenClass, withAnimation = true }) {
    element.classList.add(hiddenClass);

    if (this.showHideWithAnimation) {
      element.addEventListener(
        'transitionend',
        () => {
          element.style.display = 'none';
        },
        { once: true },
      );

      return;
    }

    element.style.display = 'none';
  }

  showTask(taskElement) {
    requestAnimationFrame(() =>
      taskElement.classList.remove(this.stateClasses.taskHidden),
    );
  }

  deleteTask(taskElement) {
    taskElement.style.height = `${taskElement.offsetHeight}px`;

    requestAnimationFrame(() => {
      taskElement.classList.add('task--hidden');
    });

    taskElement.addEventListener('transitionend', taskElement.remove, {
      once: true,
    });
  }

  async animateTaskSwap(
    taskListElement,
    { tasks, taskElement, taskIndex, isChecked },
  ) {
    taskElement.style.position = 'relative';
    taskElement.style.zIndex = '1';
    taskElement.classList.add(this.stateClasses.taskChangingPosition);

    const transitionDuration = getTransitionDurationInMs(taskElement);

    const tasksBelow = tasks.slice(taskIndex + 1);
    const tasksAbove = tasks.slice(0, taskIndex);
    const tasksToMove = isChecked ? tasksBelow : tasksAbove;

    const gap = parseInt(window.getComputedStyle(tasks[0]).marginBottom) || 0;
    const height = taskElement.offsetHeight + gap;
    const totalHeight = height * tasksToMove.length;

    tasksToMove.reverse().forEach((element, index) => {
      element.style.transitionDelay = `${(index + 1) * transitionDuration}ms`;
      element.style.transform = isChecked
        ? `translateY(-${height}px)`
        : `translateY(${height}px)`;
    });

    taskElement.style.transform = isChecked
      ? `translateY(${totalHeight}px)`
      : `translateY(-${totalHeight}px)`;
    await wait(transitionDuration * (tasksToMove.length + 1));

    taskElement.classList.remove(this.stateClasses.taskChangingPosition);
    await wait(transitionDuration);

    const task = taskElement.cloneNode(true);

    task.style.position = '';
    task.style.zIndex = '';
    task.style.transform = '';

    tasksToMove.forEach((element) => {
      element.style.transition = 'none';
      element.style.transitionDelay = '';
      element.style.transform = '';
    });

    if (isChecked) {
      taskListElement.appendChild(task);
    } else {
      taskListElement.insertBefore(task, taskListElement.firstElementChild);
    }
    taskElement.remove();

    await new Promise((resolve) => requestAnimationFrame(resolve));
    tasksToMove.forEach((element) => {
      element.style.transition = '';
    });
  }
}

export default AnimationController;
