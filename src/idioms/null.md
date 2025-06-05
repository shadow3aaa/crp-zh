# Null（nullptr）

本节介绍 C++ 中 `nullptr` 的惯用用法，以及如何在 Rust 中实现相同的效果。

由于语言差异，C++ 中某些 `nullptr` 的用法在 Rust 中根本不会出现。例如，[被移动的对象不会留下需要销毁的内容](./null/moved_members.md)。因此，无需像在 C++ 中那样，用 `nullptr` 作为已移动指针的占位符，以便后续可以对其调用 `delete` 或 `free`。

其他用法则被 `Option` 替代。在安全的 Rust 中，访问其内部值前必须检查是否为空。这种用法非常常见，以至于 [Rust 针对某些情况做了优化](https://doc.rust-lang.org/std/option/index.html#representation)：当 `Option` 与引用（`&` 或 `&mut ref`）、`Box`（等同于 `unique_ptr`）以及 `NonNull`（非空原始指针）一起使用时，会有特殊的表示优化。
