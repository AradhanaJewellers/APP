import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { fetchRateSnapshot, formatInr, type RateSnapshot } from '@/services/rates';
import { byCategory, getById, imageFor } from '@/services/products';
import { MASTER } from '@/config/master';
import { useWishlist } from '@/store/wishlist';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toggle, has } = useWishlist();
  const [snap, setSnap] = useState<RateSnapshot | null>(null);
  const [imgError, setImgError] = useState(false);

  const product = id ? getById(id) : undefined;

  useEffect(() => {
    let cancelled = false;
    fetchRateSnapshot()
      .then((s) => { if (!cancelled) setSnap(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!product) {
    return (
      <ThemedView style={styles.center}>
        <SafeAreaView style={styles.center}>
          <ThemedText style={styles.notFoundTitle}>Product Not Found</ThemedText>
          <ThemedText style={styles.notFoundSub}>This item may no longer be available.</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backBtnText}>Go Back</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const img = imageFor(product);
  const similar = byCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 8);
  const estimate =
    product.weight && snap
      ? Math.round((product.weight * snap.published.rate22kt) / 10)
      : null;
  const wish = has(product.id);

  const enquire = () => {
    const text = encodeURIComponent(
      `Namaste ${MASTER.displayName}, I am interested in ${product.categoryName} (${product.label}). Please share details.`,
    );
    Linking.openURL(`${MASTER.whatsapp}?text=${text}`);
  };

  const share = () => {
    void Share.share({
      message: `${product.categoryName} \u2014 ${product.label}\nFrom ${MASTER.displayName}, Boisar\nView similar designs in the Aradhana Jewellers app.`,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn} accessibilityLabel="Back">
            <ThemedText style={styles.headerBtnText}>{'\u2190'}</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>{product.categoryName}</ThemedText>
          <Pressable onPress={share} hitSlop={12} style={styles.headerBtn} accessibilityLabel="Share">
            <ThemedText style={styles.headerBtnText}>{'\u2197'}</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Image */}
          <View style={[styles.imageCard, Shadow.md]}>
            {img && !imgError ? (
              <Image source={img} style={styles.image} resizeMode="contain" onError={() => setImgError(true)} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ThemedText style={styles.imagePlaceholderText}>Photo coming soon</ThemedText>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoTop}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.productCategory}>{product.categoryName}</ThemedText>
                <ThemedText style={styles.productLabel}>Item {product.label}</ThemedText>
              </View>
              <Pressable onPress={() => toggle(product.id)} style={[styles.heartBtn, wish && styles.heartBtnActive]} accessibilityLabel="Save">
                <ThemedText style={[styles.heartIcon, wish && styles.heartIconActive]}>{wish ? '\u2665' : '\u2661'}</ThemedText>
              </Pressable>
            </View>

            {/* Tags */}
            <View style={styles.tagRow}>
              {product.karat && (
                <View style={styles.tag}>
                  <ThemedText style={styles.tagText}>{product.karat}K Gold</ThemedText>
                </View>
              )}
              {product.weight && (
                <View style={styles.tag}>
                  <ThemedText style={styles.tagText}>{product.weight.toFixed(2)}g</ThemedText>
                </View>
              )}
              <View style={[styles.tag, styles.tagHallmark]}>
                <ThemedText style={[styles.tagText, styles.tagHallmarkText]}>916 Hallmarked</ThemedText>
              </View>
            </View>
          </View>

          {/* Price Card */}
          <View style={[styles.priceCard, Shadow.sm]}>
            {estimate !== null ? (
              <>
                <View style={styles.priceHeader}>
                  <ThemedText style={styles.priceLabel}>Estimated Value</ThemedText>
                  <View style={styles.priceLiveTag}>
                    <View style={styles.priceLiveDot} />
                    <ThemedText style={styles.priceLiveText}>LIVE RATE</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.priceValue}>{'\u20B9'} {formatInr(estimate)}</ThemedText>
                <ThemedText style={styles.priceCalc}>
                  {product.weight}g \u00D7 {'\u20B9'}{formatInr(snap?.published.rate22kt ?? 0)}/10g
                </ThemedText>
                {snap && (
                  <ThemedText style={styles.priceMeta}>
                    Based on today{'\u2019'}s {product.karat === 18 ? '18K' : '22K'} rate \u00B7 Updated {snap.published.atIst} IST
                  </ThemedText>
                )}
                <View style={styles.priceDivider} />
                <ThemedText style={styles.priceDisclaimer}>
                  Final price confirmed at counter based on weight, rate at time of billing, plus GST and making charges.
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText style={styles.priceValue}>Price on Request</ThemedText>
                <ThemedText style={styles.priceDisclaimer}>
                  Exact weight and purity confirmed from the tag at the counter.
                </ThemedText>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable onPress={enquire} style={[styles.actionBtnPrimary, Shadow.sm]} accessibilityLabel="Ask about this design">
              <ThemedText style={styles.actionBtnPrimaryIcon}>{'\u2709'}</ThemedText>
              <ThemedText style={styles.actionBtnPrimaryText}>Ask About This</ThemedText>
            </Pressable>
          </View>
          <View style={styles.actionRowSecondary}>
            <Pressable onPress={share} style={[styles.actionBtnSecondary]} accessibilityLabel="Share">
              <ThemedText style={styles.actionBtnSecondaryIcon}>{'\u2197'}</ThemedText>
              <ThemedText style={styles.actionBtnSecondaryText}>Share</ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push('/collections')} style={[styles.actionBtnSecondary]} accessibilityLabel="View Similar">
              <ThemedText style={styles.actionBtnSecondaryIcon}>{'\u25CE'}</ThemedText>
              <ThemedText style={styles.actionBtnSecondaryText}>View Similar</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/store')}
              style={[styles.actionBtnSecondary]}
              accessibilityLabel="Visit Store">
              <ThemedText style={styles.actionBtnSecondaryIcon}>{'\u2302'}</ThemedText>
              <ThemedText style={styles.actionBtnSecondaryText}>Visit Store</ThemedText>
            </Pressable>
          </View>

          {/* WhatsApp CTA */}
          <Pressable onPress={enquire} accessibilityLabel="Enquire on WhatsApp">
            <View style={[styles.ctaWhatsApp, Shadow.sm]}>
              <ThemedText style={styles.ctaWhatsAppText}>
                {'\uD83D\uDCAC'} Enquire on WhatsApp \u2014 {MASTER.phone}
              </ThemedText>
            </View>
          </Pressable>

          {/* View Similar */}
          {similar.length > 0 && (
            <>
              <View style={styles.similarHeader}>
                <ThemedText style={styles.similarTitle}>Similar Designs</ThemedText>
                <ThemedText style={styles.similarCount}>{similar.length} items</ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
                {similar.map((p) => {
                  const simg = imageFor(p);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => router.push(`/product/${p.id}`)}
                      style={[styles.similarCard, Shadow.sm]}
                      accessibilityLabel={`Similar ${p.categoryName} ${p.label}`}>
                      {simg ? (
                        <Image source={simg} style={styles.similarImg} resizeMode="contain" />
                      ) : (
                        <View style={[styles.similarImg, { backgroundColor: '#F8F6F3' }]} />
                      )}
                      <View style={styles.similarInfo}>
                        <ThemedText style={styles.similarLabel} numberOfLines={1}>{p.label}</ThemedText>
                        <Pressable onPress={() => {
                          const text = encodeURIComponent(`Namaste ${MASTER.displayName}, please show me designs similar to ${p.label}.`);
                          Linking.openURL(`${MASTER.whatsapp}?text=${text}`);
                        }}>
                          <ThemedText style={styles.similarAsk}>Ask</ThemedText>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <ThemedText style={styles.disclaimerText}>
              Hallmarked 916 jewellery. Final price depends on the prevailing rate at the time of billing, plus GST and making charges where applicable.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  /* Header */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: { fontSize: 18, color: '#1A1A2E' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A2E', textAlign: 'center', marginHorizontal: 8 },

  /* Content */
  content: { gap: 16, paddingBottom: Spacing.six },

  /* Image */
  imageCard: {
    marginHorizontal: 16,
    borderRadius: BorderRadius.xl,
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 14, color: '#9CA3AF' },

  /* Info */
  infoSection: { marginHorizontal: 16, gap: 10 },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productCategory: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', letterSpacing: -0.3 },
  productLabel: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F6F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  heartBtnActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  heartIcon: { fontSize: 22, color: '#9CA3AF' },
  heartIconActive: { color: '#DC2626' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#F8F6F3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  tagText: { fontSize: 11, fontWeight: '600', color: '#1A1A2E' },
  tagHallmark: { backgroundColor: '#FDF8ED', borderColor: '#E8D9A8' },
  tagHallmarkText: { color: '#A68523' },

  /* Price Card */
  priceCard: {
    marginHorizontal: 16,
    backgroundColor: '#23519D',
    borderRadius: BorderRadius.xl,
    padding: 20,
    gap: 4,
  },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  priceLabel: { color: '#C9A84C', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  priceLiveTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(22,163,74,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  priceLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#16A34A' },
  priceLiveText: { fontSize: 9, fontWeight: '700', color: '#16A34A', letterSpacing: 1 },
  priceValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  priceCalc: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  priceMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  priceDivider: { height: 1, backgroundColor: 'rgba(201,168,76,0.25)', marginVertical: 8 },
  priceDisclaimer: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 15 },

  /* Actions */
  actionRow: { marginHorizontal: 16, gap: 10 },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#23519D',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
  },
  actionBtnPrimaryIcon: { fontSize: 16, color: '#FFFFFF' },
  actionBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  actionRowSecondary: { marginHorizontal: 16, flexDirection: 'row', gap: 10 },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  actionBtnSecondaryIcon: { fontSize: 14, color: '#1A1A2E' },
  actionBtnSecondaryText: { fontSize: 12, fontWeight: '600', color: '#1A1A2E' },

  /* WhatsApp CTA */
  ctaWhatsApp: {
    marginHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
  },
  ctaWhatsAppText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  /* Similar */
  similarHeader: { marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  similarTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  similarCount: { fontSize: 12, color: '#9CA3AF' },
  similarRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  similarCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E1D8',
    overflow: 'hidden',
  },
  similarImg: { width: 120, height: 120 },
  similarInfo: { padding: 8, gap: 2 },
  similarLabel: { fontSize: 11, color: '#1A1A2E', fontWeight: '500' },
  similarAsk: { fontSize: 11, fontWeight: '700', color: '#23519D' },

  /* Disclaimer */
  disclaimer: {
    marginHorizontal: 16,
    backgroundColor: '#F8F6F3',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  disclaimerText: { fontSize: 11, color: '#6B7280', lineHeight: 16 },

  /* Not Found */
  notFoundTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  notFoundSub: { fontSize: 13, color: '#6B7280' },
  backBtn: { backgroundColor: '#23519D', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  backBtnText: { color: '#FFFFFF', fontWeight: '600' },
});
