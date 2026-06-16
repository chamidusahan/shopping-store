package lk.jiat.shoppingstore.entity;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@NamedQuery(name = "Size.findByValue",
            query = "FROM Size s WHERE s.size =: value")
public class Size implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(length = 10, nullable = false,unique = true)
    private String size;

    public enum Type{
        S,
        M,
        L,
        XL,
        XXL,
        XXXL
    }

    @ManyToMany(mappedBy = "sizes" )
    private List<Product> products = new ArrayList<>();



    public List<Product> getProducts() {
        return products;
    }

    public void setProducts(List<Product> products) {
        this.products = products;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }
}
