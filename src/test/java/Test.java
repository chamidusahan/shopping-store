import lk.jiat.shoppingstore.util.HibernateUtil;
import org.hibernate.SessionFactory;

public class Test {
    public static void main(String[] args) {
        SessionFactory sessionFactory = HibernateUtil.getSessionFactory();
    }
}
