# 成员的移动

在 Rust 中，将值从变量或字段中移出比在 C++ 中更加显式。一个可能被移动且不会留下任何内容的值，在 Rust 中需要用 `Option<Box<T>>` 类型来表示，而在 C++ 中只需用 `std::unique_ptr<T>`。

<div class="comparison">

```c++
#include <memory>

void readMailbox(std::unique_ptr<int> &mailbox,
                 std::mutex mailboxMutex) {
  std::lock_guard<std::mutex> guard(mailboxMutex);

  if (!mailbox) {
    return;
  }
  int x = *mailbox;
  mailbox = nullptr;
  // use x
}
```

```rust
use std::sync::Arc;
use std::sync::Mutex;

fn read(mailbox: Arc<Mutex<Option<i32>>>) {
    let Ok(mut x) = mailbox.lock() else {
        return;
    };
    let x = x.take();
    // use x
}
```

</div>

此外，当你需要从一个可变引用中取得所有权时，必须在原位置留下某些内容。这可以通过 [`std::mem::swap`](https://doc.rust-lang.org/std/mem/fn.swap.html) 实现，许多类似容器的类型也提供了更方便的所有权交换方法，例如前面例子中的 [`Option::take`](https://doc.rust-lang.org/std/option/enum.Option.html#method.take)、[`Option::replace`](https://doc.rust-lang.org/std/option/enum.Option.html#method.replace) 或 [`Vec::swap`](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.swap_remove)。

## 删除已移动的对象

现代 C++ 中另一个常见的空指针用法，是作为已移动对象成员的值，以便析构函数仍然可以安全调用。例如：

```cpp
$#include <cstdlib>
$#include <cstring>
$
// widget.h
struct widget_t;
widget_t *alloc_widget();
void free_widget(widget_t*);
void copy_widget(widget_t* dst, widget_t* src);

// widget.cc
class Widget {
    widget_t* widget;
public:
$    Widget() : widget(alloc_widget()) {}
$
$    Widget(const Widget &other) : widget(alloc_widget()) {
$        copy_widget(widget, other.widget);
$    }
$
    Widget(Widget &&other) : widget(other.widget) {
        other.widget = nullptr;
    }

    ~Widget() {
        free_widget(widget);
    }
};
```

Rust 对象的移动不会留下一个需要调用析构函数的对象，因此这种空指针的用法在 Rust 中没有对应的惯用法。更多细节请参见 [拷贝与移动构造函数](../constructors/copy_and_move_constructors.md) 章节。
