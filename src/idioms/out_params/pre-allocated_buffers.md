# 预分配缓冲区

在某些情况下，需要从一个会被反复调用的函数中返回大量数据，此时如果每次都通过值返回或频繁进行堆分配，所带来的拷贝和分配开销将难以接受。这类场景包括：

- 执行文件或网络 IO，
- 与图形硬件通信，
- 与嵌入式系统的硬件通信，或
- 实现加密算法。

在这些情况下，C++ 程序通常会预先分配一个缓冲区，并在所有调用中复用它。这通常也意味着可以将缓冲区分配在栈上，而无需使用动态存储。

下面的示例演示了如何预先分配一个缓冲区，并在循环中将大文件读取到该缓冲区中。

<div class="comparison">

```cpp
#include <fstream>

int main() {
  std::ifstream file("/path/to/file");
  if (!file.is_open()) {
    return -1;
  }

  byte buf[1024];
  while (file.good()) {
    file.read(buf, sizeof buf);
    std::streamsize count = file.gcount();

    // 使用 buf 中的数据
  }

  return 0;
}
```

```rust,no_run
use std::fs::File;
use std::io::{BufReader, Read};

fn main() -> Result<(), std::io::Error> {
    let mut f = BufReader::new(File::open(
        "/path/to/file",
    )?);

    let mut buf = [0u8; 1024];

    loop {
        let count = f.read(&mut buf)?;
        if count == 0 {
            break;
        }

        // 使用 buf 中的数据
    }

    Ok(())
}
```

</div>

C++ 程序与 Rust 程序的主要区别在于，Rust 程序中的缓冲区在使用前必须初始化。大多数情况下，这种一次性的初始化开销并不显著。如果确实有影响，则需要使用 unsafe Rust 来避免初始化。

避免初始化的技术依赖于 [`std::mem::MaybeUninit`](https://doc.rust-lang.org/std/mem/union.MaybeUninit.html)。该类型的 [安全用法示例](https://doc.rust-lang.org/std/mem/union.MaybeUninit.html#examples) 可在其 API 文档中找到。

目前稳定版 Rust 的 IO API 并不支持 `MaybeUninit`。不过，[有一个新的安全 API 正在开发中](#upcoming-changes-and-borrowedbuf)，它将允许在使用该 API 的代码中避免初始化，而无需使用 unsafe Rust。

如果被调用方可能需要扩展所提供的缓冲区，并且允许动态分配，则可以使用 `&mut Vec<T>` 替代 `&mut [T]`。这类似于在 C++ 中传递 `std::vector<T>&`。为了避免不必要的重新分配，可以使用 `Vec::<T>::with_capacity(n)` 创建向量。

## 关于读取文件的说明

虽然这里的示例使用 IO 来演示复用预分配缓冲区，但实际上有更高级的接口可用于从 `File` 读取数据，包括 [`Read`](https://doc.rust-lang.org/std/io/trait.Read.html) 和 [`BufRead`](https://doc.rust-lang.org/std/io/trait.BufRead.html) trait，以及 [`std::io`](https://doc.rust-lang.org/std/io/index.html#functions-1) 和 [`std::fs`](https://doc.rust-lang.org/std/fs/index.html#functions-1) 中的便捷函数。

然而，这里描述的技术在其他需要复用缓冲区的场景下也很有用，比如与硬件 API 交互、使用现有的 C 或 C++ 库，或实现以分块方式产生大量数据的算法（如加密算法）时。

## 即将到来的变化与 `BorrowedBuf`

Rust 社区正在不断完善对未初始化缓冲区的处理方式。在 Rust 的 nightly 分支上，可以使用 [`BorrowedBuf`](https://doc.rust-lang.org/std/io/struct.BorrowedBuf.html) 实现与使用 `MaybeUninit` 切片类似的效果，但无需编写任何 unsafe 代码。用于避免不必要初始化的 IO API 采用 `BorrowedBuf`，而不是 `MaybeUninit` 的切片。

{{#quiz pre-allocated_buffers.toml}}
