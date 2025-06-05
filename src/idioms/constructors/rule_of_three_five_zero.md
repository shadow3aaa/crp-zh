# 三/五/零法则

## 三法则

在 C++ 中，三法则是一条经验法则：如果一个类自定义了析构函数、拷贝构造函数或拷贝赋值运算符，那么它很可能需要同时自定义这三者。

Rust 中的对应规则是：如果一个类型自定义了 `Clone` 或 `Drop` 实现，那么它很可能需要同时实现这两个 trait。原因与 C++ 的三法则相同：如果一个类型自定义了 `Clone` 或 `Drop`，通常是因为该类型管理某种资源，而 `Clone` 和 `Drop` 都需要对该资源进行特殊处理。

## 五法则

C++ 的五法则指出：如果一个类型自定义了拷贝构造函数或拷贝赋值运算符，并且需要移动语义，那么也应当自定义移动构造函数和移动赋值运算符，因为不会自动生成隐式的移动构造函数或移动赋值运算符。

在 Rust 中，这条规则并不适用，因为 [C++ 和 Rust 的移动语义不同](copy_and_move_constructors.md#move-constructors)。

## 零法则

零法则认为：自定义拷贝/移动构造函数、赋值运算符和析构函数的类应只处理所有权问题，其他类则不应自定义这些函数。实际上，大多数类应当使用 STL 中的类型（如 `shared_ptr`、`vector` 等）来处理所有权，这样隐式定义的拷贝和移动构造函数就足够了。

在 Rust 中同样如此。可参考 Rust 类型等价表，了解 C++ [智能指针类型](../type_equivalents.md#pointers) 和 [容器类型](../type_equivalents.md#containers) 的对应关系。

C++ 和 Rust 在应用零法则时有一个区别：C++ 的 `std::unique_ptr` 可以接受自定义删除器，因此可以用来包装需要自定义析构逻辑的原始指针。而在 Rust 中，`Box` 类型并没有类似的参数化机制。要实现类似功能，需要自定义一个类型并实现 `Drop`，具体可参考[拷贝和移动构造函数章节中的示例](./copy_and_move_constructors.md#user-defined-constructors)。

{{#quiz rule_of_three_five_zero.toml}}
