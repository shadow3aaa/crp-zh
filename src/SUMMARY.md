# 目录

[从 C++ 到 Rust 语法手册](./title-page.md)

# 惯用法

- [构造函数](./idioms/constructors.md)
  - [默认构造函数](./idioms/constructors/default_constructors.md)
  - [拷贝与移动构造函数](./idioms/constructors/copy_and_move_constructors.md)
  - [三/五/零法则](./idioms/constructors/rule_of_three_five_zero.md)
  <!-- - [分离构造与初始化](./idioms/constructors/partial_initialzation.md) -->
- [析构函数与资源清理](./idioms/destructors.md)
- [数据建模](./idioms/data_modeling.md)
  - [抽象类、接口与动态分发](./idioms/data_modeling/abstract_classes.md)
  - [概念、接口与静态分发](./idioms/data_modeling/concepts.md)
  - [枚举](./idioms/data_modeling/enums.md)
  - [标记联合与 `std::variant`](./idioms/data_modeling/tagged_unions.md)
  - [继承与实现复用](./idioms/data_modeling/inheritance_and_reuse.md)
  - [模板类、函数与方法](./idioms/data_modeling/templates.md)
  - [模板特化](./idioms/data_modeling/template_specialization.md)
- [空值（`nullptr`）](./idioms/null.md)
  - [哨兵值](./idioms/null/sentinel_values.md)
  - [已移动成员](./idioms/null/moved_members.md)
  - [零长度数组](./idioms/null/zero_length_arrays.md)
- [封装](./idioms/encapsulation.md)
  - [头文件](./idioms/encapsulation/headers.md)
  - [匿名命名空间与 `static`](./idioms/encapsulation/anonymous_namespaces.md)
  - [私有成员与友元](./idioms/encapsulation/private_and_friends.md)
  - [私有构造函数](./idioms/encapsulation/private_constructors.md)
  - [Setter 与 Getter 方法](./idioms/encapsulation/setters_and_getters.md)
- [异常与错误处理](./idioms/exceptions.md)
  - [预期错误](./idioms/exceptions/expected_errors.md)
  - [表示程序缺陷的错误]()
- [类型等价](./idioms/type_equivalents.md)
- [类型提升与转换](./idioms/promotions_and_conversions.md)
- [用户自定义转换](./idioms/user-defined_conversions.md)
- [重载](./idioms/overloading.md)
- [RTTI]()
- [迭代器]()
- [函数对象、Lambda 与闭包]()
- [对象标识](./idioms/object_identity.md)
- [输出参数](./idioms/out_params.md)
  - [多返回值](./idioms/out_params/multiple_return.md)
  - [可选返回值](./idioms/out_params/optional_return.md)
  - [预分配缓冲区](./idioms/out_params/pre-allocated_buffers.md)
- [可变参数]()
- [属性]()
- [调用 C（FFI）]()
- [NRVO、RVO 与 placement new]()
- [并发（线程与异步）]()

# 模式

- [访问者模式与双重分发]()
- [奇异递归模板模式（CRTP）](./patterns/crtp.md)
- [实现指针（PImpl）]()
- [X 宏]()

# 生态系统

- [库](./etc/libraries.md)
- [单元测试]()
- [文档（Doxygen）]()
- [构建系统（CMake）]()

---

- [归属声明](./notices.md)
