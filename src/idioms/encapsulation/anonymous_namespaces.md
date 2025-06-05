# 匿名命名空间与 `static`

C++ 中的匿名命名空间用于避免不同翻译单元之间的符号冲突。这类冲突会违反[单一定义规则（ODR）](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr#14)，导致未定义行为（最好的情况是链接错误）。

例如，如果不使用匿名命名空间，下面的代码会导致未定义行为（由于 `inline` 产生弱符号，目标文件不会报链接错误）。

```cpp
/// a.cc
namespace {
    inline void common_function_name() {
        // ...
    }
}

/// b.cc
namespace {
    inline void common_function_name() {
        // ...
    }
}
```

C++ 的 `static` 声明也可以实现相同的目的，使声明具有内部链接属性（即在翻译单元外不可见）。

Rust 通过同时控制链接属性和可见性来避免此类问题，声明总是即为定义。Rust 不使用翻译单元，而是以[模块](./headers.md)为结构单位，模块既提供命名空间，也控制定义的可见性，从而让编译器保证不会发生符号冲突。

下面的 Rust 程序实现了与上面 C++ 程序相同的目标，即避免两个函数发生冲突，同时允许它们在各自定义的文件中使用。

```rust
// a.rs
# mod a {
fn common_function_name() {
    // ...
}
# }

// b.rs
# mod b {
fn common_function_name() {
    // ...
}
# }
```

此外，

1. 与 C++ 命名空间不同，Rust 的模块（既提供命名空间也控制可见性）只能定义一次，编译器会进行检查。
2. 每个文件[定义一个模块，且必须显式包含在模块层级中](https://doc.rust-lang.org/stable/book/ch07-05-separating-modules-into-different-files.html)。
3. 来自 Rust crate（库）的模块总是带有某个根模块名进行限定，因此不会发生冲突。如果会冲突，[根模块名必须被用户自定义名称替换](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#renaming-dependencies-in-cargotoml)。

## 关于 C 语言互操作的注意事项

当使用非 Rust 管理的库时，如果目标文件中出现符号冲突，通常会出现上述问题。这在使用 C 或 C++ 的静态或动态库时可能发生，也可能在将 Rust 静态或动态库用于 C 或 C++ 程序时发生。

Rust 提供了 [`#[unsafe(no_mangle)]`](https://doc.rust-lang.org/reference/abi.html#the-no_mangle-attribute) 属性，用于跳过名称修饰，以便生成可被 C 或 C++ 直接引用的函数。但这同样可能因名称冲突导致未定义行为。

{{#quiz anonymous_namespaces.toml}}
