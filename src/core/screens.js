export function createScreens() {
  const stack = [];
  return {
    reset(screen) {
      stack.length = 0;
      stack.push(screen);
      screen.enter?.();
    },
    push(screen) {
      stack[stack.length - 1]?.blur?.();
      stack.push(screen);
      screen.enter?.();
    },
    pop() {
      stack.pop()?.exit?.();
      stack[stack.length - 1]?.focus?.();
      return stack[stack.length - 1];
    },
    top() {
      return stack[stack.length - 1];
    },
  };
}
