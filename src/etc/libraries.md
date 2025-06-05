# 库

C++ 程序通常使用操作系统发行版自带的库，或者将库直接集成到项目中。

Rust 程序则更倾向于依赖一个名为 [crates.io](https://crates.io/) 的 Rust 库（“crate”）中央注册表（以及一个由这些 crate 的代码内文档生成的中央文档库 [docs.rs](https://docs.rs/)）。对 crate 的依赖通过 [Cargo 包管理器](https://doc.rust-lang.org/cargo/index.html) 进行管理。

[Lib.rs](https://lib.rs/) 是一个很好的资源，可以按类别查找流行的 crate。

## 一些具体的替代方案

| C++ 库                        | Rust 替代库                                               |
|-------------------------------|-----------------------------------------------------------|
| STL UTF-16 和 UTF-32 字符串   | [widestring](https://docs.rs/widestring/latest/widestring/) |
| STL 随机数                    | [rand](https://github.com/rust-random/rand)               |
| STL 正则表达式                | [regex](https://github.com/rust-lang/regex)               |
| Boost.Test                    | [cargo test](https://doc.rust-lang.org/book/ch11-01-writing-tests.html) |
| pybind11                      | [PyO3](https://pyo3.rs/)                                  |
| OpenSSL                       | [rustls](https://github.com/rustls/rustls)                |
<!-- | STL `multiset`                |                                                             |
| STL `multimap`                |                                                             | -->

如果你使用的某个 C++ 库找不到对应的 Rust 替代库，请通过下方的反馈链接告知我们该库的名称及用途。

## 供应链管理

在需要管理库供应链的场景下，Cargo 可以配合 [自定义的自管或组织托管注册表](https://doc.rust-lang.org/cargo/reference/registries.html) 或 [从 crates.io 获取的依赖库的本地化版本](https://doc.rust-lang.org/cargo/commands/cargo-vendor.html) 使用。

这两种方式都为依赖项审查和供应链安全提供了机制。

不涉及本地化或自定义注册表的供应链安全解决方案[正在推进中](https://github.com/rust-lang/rfcs/pull/3724)。
